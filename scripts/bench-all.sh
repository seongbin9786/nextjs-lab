#!/usr/bin/env bash
# 저장소의 모든 정량 벤치를 순서대로 실행합니다. (수 분 소요)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run() {
  local name="$1"; local dir="$2"; local script="$3"
  echo ""
  echo "########################################"
  echo "# $name"
  echo "########################################"
  (cd "$ROOT/$dir" && bash "$script") || echo "($name 실행 실패)"
}

run "03 서버 합성 vs 전부 클라이언트 번들" "examples/03-server-client-components" "scripts/compare-bundles.sh"
run "04 스트리밍 TTFB" "examples/04-streaming-suspense" "scripts/bench.sh"
run "05 데이터 캐시 TTFB" "examples/05-data-fetching-caching" "scripts/bench.sh"
run "10 이미지 전송량" "examples/10-image-optimization" "scripts/bench.sh"
run "18 지연 로딩 번들" "examples/18-dynamic-imports" "scripts/compare-bundles.sh"
run "22 Turbopack vs webpack" "examples/22-turbopack-dx" "scripts/bench.sh"

# 벤치 후 남은 서버 정리
pkill -f "next start" >/dev/null 2>&1 || true
pkill -f "next-server" >/dev/null 2>&1 || true

echo ""
echo "모든 벤치 완료."
