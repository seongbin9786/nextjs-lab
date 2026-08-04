#!/usr/bin/env bash
# Turbopack(기본)과 webpack의 빌드/dev 속도를 비교합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> 의존성 설치"
pnpm install --silent >/dev/null 2>&1 || pnpm install

measure_build() {
  local label="$1"; shift
  local best=""
  for i in 1 2 3; do
    local start end elapsed
    start=$(date +%s.%N)
    "$@" >/dev/null 2>&1
    end=$(date +%s.%N)
    elapsed=$(awk -v a="$start" -v b="$end" 'BEGIN { printf "%.2f", b - a }')
    echo "  ${label} ${i}차: ${elapsed}s"
    if [ -z "$best" ] || awk -v a="$elapsed" -v b="$best" 'BEGIN { exit a < b ? 0 : 1 }'; then
      best="$elapsed"
    fi
  done
  echo "$best"
}

echo ""
echo "==> 프로덕션 빌드 비교 (3회 중 가장 빠른 값)"
echo "[Turbopack]"
tp=$(measure_build "빌드" pnpm exec next build | tail -1)
echo "[webpack]"
wp=$(measure_build "빌드" pnpm exec next build --webpack | tail -1)

echo ""
echo "==> dev 서버 첫 응답 시간 (컴파일 포함)"
measure_dev() {
  local label="$1"; shift
  # 이전 dev 서버 잔존 프로세스 정리 후 캐시 삭제
  pkill -f "next dev" >/dev/null 2>&1 || true
  pkill -f "next-server" >/dev/null 2>&1 || true
  sleep 1
  rm -rf .next 2>/dev/null || true
  "$@" >/dev/null 2>&1 &
  local pid=$!
  local start end
  start=$(date +%s.%N)
  for _ in $(seq 1 120); do
    if curl -s -o /dev/null http://localhost:3000 2>/dev/null; then break; fi
    sleep 0.2
  done
  end=$(date +%s.%N)
  kill "$pid" 2>/dev/null || true
  wait "$pid" 2>/dev/null || true
  awk -v a="$start" -v b="$end" 'BEGIN { printf "%.2f", b - a }'
}

echo "[Turbopack dev]"
tpdev=$(measure_dev "dev" pnpm exec next dev)
echo "  첫 응답: ${tpdev}s"
echo "[webpack dev]"
wpdev=$(measure_dev "dev" pnpm exec next dev --webpack)
echo "  첫 응답: ${wpdev}s"

# 마무리: 남은 dev 서버 정리
pkill -f "next dev" >/dev/null 2>&1 || true
pkill -f "next-server" >/dev/null 2>&1 || true

echo ""
echo "================ 결과 ================"
echo "빌드 (Turbopack): ${tp}s"
echo "빌드 (webpack):   ${wp}s  ($(awk -v a="$wp" -v b="$tp" 'BEGIN { printf "%.1f", a / b }')배)"
echo "dev 첫 응답 (Turbopack): ${tpdev}s"
echo "dev 첫 응답 (webpack):   ${wpdev}s"
echo "======================================"
echo ""
echo "참고: 앱 규모가 클수록 격차는 더 벌어집니다. (공식 발표: 빌드 2~5배,"
echo "Fast Refresh 최대 10배) 이 예시는 아주 작은 앱이라 격차가 보수적으로"
echo "측정된 것입니다."
