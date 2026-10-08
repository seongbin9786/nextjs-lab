#!/usr/bin/env bash
# 서버 합성 페이지와 전부-클라이언트 페이지의 첫 로딩 JS를 비교합니다.
# 결과를 app/compare/page.tsx 에 반영합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3126

echo "==> 데이터 생성"
node scripts/gen-catalog.mjs >/dev/null

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

first_load_kb() {
  local path="$1"
  curl -s "http://localhost:$PORT$path" \
    | grep -oE '<script[^>]*src="/_next/static/[^"]*\.js"' \
    | grep -oE '/_next/static/[^"]*\.js' \
    | sort -u \
    | while read -r f; do
        wc -c 2>/dev/null < ".next/${f#/_next/}" || echo 0
      done \
    | awk '{ sum += $1 } END { printf "%.1f", sum / 1024 }'
}

server_kb=$(first_load_kb "/compare/server")
client_kb=$(first_load_kb "/compare/client")
diff_kb=$(awk -v a="$client_kb" -v b="$server_kb" 'BEGIN { printf "%.1f", a - b }')

echo ""
echo "/compare/server 첫 로딩 JS: ${server_kb} kB"
echo "/compare/client 첫 로딩 JS: ${client_kb} kB"
echo "차이:                       ${diff_kb} kB"

# 자리표시자(__SERVER__ 등)는 첫 실행에서 실제 수치로 바뀝니다. 이후 실행에서는
# 바꿀 대상이 없으므로 측정값만 출력하고 파일은 그대로 둡니다.
if grep -q "__SERVER__ kB" app/compare/page.tsx; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|__SERVER__ kB|${server_kb} kB|g; s|__CLIENT__ kB|${client_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/compare/page.tsx
  else
    sed -i "s|__SERVER__ kB|${server_kb} kB|g; s|__CLIENT__ kB|${client_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/compare/page.tsx
  fi
  echo "app/compare/page.tsx 에 수치를 반영했습니다."
else
  echo "app/compare/page.tsx 에 자리표시자가 없어 수치를 반영하지 않았습니다. (필요하면 직접 수정)"
fi
