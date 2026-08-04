#!/usr/bin/env bash
# 서버 합성 페이지와 전부-클라이언트 페이지의 첫 로딩 JS를 비교합니다.
# 결과를 app/compare/page.tsx 에 반영합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3126

echo "==> 데이터 생성"
node scripts/gen-catalog.mjs >/dev/null

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

first_load_kb() {
  local path="$1"
  curl -s "http://localhost:$PORT$path" \
    | grep -oE '<script[^>]*src="/_next/static/[^"]*\.js"' \
    | grep -oE '/_next/static/[^"]*\.js' \
    | sort -u \
    | while read -r f; do
        stat -f%z ".next/${f#/_next/}" 2>/dev/null || echo 0
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

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|__SERVER__ kB|${server_kb} kB|g; s|__CLIENT__ kB|${client_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/compare/page.tsx
else
  sed -i "s|__SERVER__ kB|${server_kb} kB|g; s|__CLIENT__ kB|${client_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/compare/page.tsx
fi
echo "app/compare/page.tsx 에 수치를 반영했습니다."
