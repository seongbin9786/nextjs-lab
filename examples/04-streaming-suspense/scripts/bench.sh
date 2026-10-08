#!/usr/bin/env bash
# 블로킹 vs 스트리밍 페이지의 TTFB(첫 바이트 도착 시간)를 비교합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3104

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

# 서버 준비 대기
ready=""
for _ in $(seq 1 30); do
  if curl -s -o /dev/null "http://localhost:$PORT"; then ready=1; break; fi
  sleep 0.5
done
if [ -z "$ready" ]; then
  echo "서버가 15초 안에 응답하지 않았습니다." >&2
  exit 1
fi

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
