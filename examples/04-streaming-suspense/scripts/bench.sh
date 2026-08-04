#!/usr/bin/env bash
# 블로킹 vs 스트리밍 페이지의 TTFB(첫 바이트 도착 시간)를 비교합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3104

echo "==> 빌드"
pnpm build >/dev/null 2>&1

echo "==> 서버 시작 (포트 $PORT)"
pnpm start -p "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

# 서버 준비 대기
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT"; then break; fi
  sleep 0.5
done

echo ""
echo "== /blocking : 데이터를 다 모은 뒤 한 번에 응답 =="
for _ in 1 2 3; do
  curl -s -o /dev/null -w "TTFB %{time_starttransfer}s | 전체 %{time_total}s\n" "http://localhost:$PORT/blocking"
done

echo ""
echo "== /streaming : 셸 즉시 전송, 느린 부분은 나중에 스트리밍 =="
for _ in 1 2 3; do
  curl -s -o /dev/null -w "TTFB %{time_starttransfer}s | 전체 %{time_total}s\n" "http://localhost:$PORT/streaming"
done

echo ""
echo "TTFB가 블로킹은 ~2초, 스트리밍은 ~0.1초 이하여야 정상입니다."
echo "(전체 시간은 둘 다 비슷합니다. 스트리밍은 총량을 줄이는 게 아니라"
echo " 첫 화면을 빨리 보여주는 최적화입니다.)"
