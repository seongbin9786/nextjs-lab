#!/usr/bin/env bash
# 정적 import 페이지와 next/dynamic 페이지의 "첫 로딩 JS"를 비교합니다.
# 빌드 후 서버를 띄우고, 각 페이지 HTML이 실제로 참조하는 JS 파일의
# 합계를 구합니다. 결과를 app/benchmark/page.tsx 에 반영합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3118

echo "==> 데이터 생성"
node scripts/gen-big-data.mjs >/dev/null

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
  # 페이지 HTML에서 "실행되는" <script src> 만 집계합니다.
  # (<link rel="preload"> 힌트는 초기 렌더링을 막지 않으므로 제외 —
  #  지연 청크는 낮은 우선순위로 놀 때 미리 받아두는 용도입니다.)
  curl -s "http://localhost:$PORT$path" \
    | grep -oE '<script[^>]*src="/_next/static/[^"]*\.js"' \
    | grep -oE '/_next/static/[^"]*\.js' \
    | sort -u \
    | while read -r f; do
        stat -f%z ".next/${f#/_next/}" 2>/dev/null || echo 0
      done \
    | awk '{ sum += $1 } END { printf "%.1f", sum / 1024 }'
}

static_kb=$(first_load_kb "/static-import")
lazy_kb=$(first_load_kb "/lazy-load")

diff_kb=$(awk -v a="$static_kb" -v b="$lazy_kb" 'BEGIN { printf "%.1f", a - b }')

echo ""
echo "/static-import 첫 로딩 JS: ${static_kb} kB"
echo "/lazy-load     첫 로딩 JS: ${lazy_kb} kB"
echo "차이:                      ${diff_kb} kB"

# benchmark 페이지에 수치 반영 (압축 전 원본 크기 기준)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|__STATIC__ kB|${static_kb} kB|g; s|__LAZY__ kB|${lazy_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/benchmark/page.tsx
else
  sed -i "s|__STATIC__ kB|${static_kb} kB|g; s|__LAZY__ kB|${lazy_kb} kB|g; s|__DIFF__ kB|${diff_kb} kB|g" app/benchmark/page.tsx
fi
echo "app/benchmark/page.tsx 에 수치를 반영했습니다."
