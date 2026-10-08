#!/usr/bin/env bash
# 캐시 없음(/fresh) vs 데이터 캐시 적중(/cached)의 TTFB를 비교합니다.
# /api/now 에는 150ms의 왕복 지연이 있어 차이가 분명하게 드러납니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3125

if lsof -ti tcp:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "포트 $PORT 를 이미 다른 프로세스가 사용 중입니다. 종료 후 다시 실행하세요." >&2
  exit 1
fi

echo "==> 빌드"
pnpm build >/dev/null 2>&1

echo "==> 서버 시작 (포트 $PORT)"
pnpm start -p "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  # pnpm이 자식 next 서버에 신호를 전달하지 못한 경우에 대비해 포트 기준으로도 정리합니다.
  lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill 2>/dev/null || true
}
trap cleanup EXIT

ready=""
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT"; then ready=1; break; fi
  sleep 0.5
done
if [ -z "$ready" ]; then
  echo "서버가 15초 안에 응답하지 않았습니다." >&2
  exit 1
fi

ttfb_ms() {
  curl -s -o /dev/null -w "%{time_starttransfer}" "$1" | awk '{ printf "%.0f", $1 * 1000 }'
}

echo ""
echo "== /fresh : 매 요청 API 호출 (캐시 없음) =="
for _ in 1 2 3; do
  echo "  TTFB $(ttfb_ms "http://localhost:$PORT/fresh")ms"
done

# /cached 첫 요청은 API를 실제로 호출해 캐시를 채웁니다.
curl -s -o /dev/null "http://localhost:$PORT/cached"
echo ""
echo "== /cached : force-cache 적중 (API 재호출 없음) =="
for _ in 1 2 3; do
  echo "  TTFB $(ttfb_ms "http://localhost:$PORT/cached")ms"
done

echo ""
echo "/fresh는 매 요청 150ms 지연이 포함되고, /cached는 캐시 적중이라"
echo "API 왕복이 빠져 훨씬 빠릅니다."
