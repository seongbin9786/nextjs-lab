#!/usr/bin/env bash
# 캐시 없음(/fresh) vs 데이터 캐시 적중(/cached)의 TTFB를 비교합니다.
# /api/now 에는 150ms의 왕복 지연이 있어 차이가 분명하게 드러납니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3125

echo "==> 빌드"
pnpm build >/dev/null 2>&1

echo "==> 서버 시작 (포트 $PORT)"
pnpm start -p "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT"; then break; fi
  sleep 0.5
done

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
