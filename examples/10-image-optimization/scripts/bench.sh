#!/usr/bin/env bash
# 원본 이미지와 next/image 최적화 응답의 실제 전송 바이트를 비교합니다.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT=3110

echo "==> 이미지 생성"
node scripts/make-images.mjs >/dev/null

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

size_of() {
  curl -s -H "Accept: $1" -o /dev/null -w "%{size_download}" "http://localhost:$PORT$2"
}

kb() { awk -v b="$1" 'BEGIN { printf "%.0f", b / 1024 }'; }

RAW=$(size_of "image/jpeg" "/images/hero.jpg")
AVIF=$(size_of "image/avif,image/webp,image/jpeg" "/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75")
WEBP=$(size_of "image/webp,image/jpeg" "/_next/image?url=%2Fimages%2Fhero.jpg&w=1080&q=75")

echo ""
echo "원본 hero.jpg (2400x1600):        $(kb "$RAW")KB"
echo "next/image AVIF (w=1080, q=75):   $(kb "$AVIF")KB  (원본 대비 $(awk -v a="$RAW" -v b="$AVIF" 'BEGIN { printf "%.1f", a / b }')배 작음)"
echo "next/image WebP (w=1080, q=75):   $(kb "$WEBP")KB  (원본 대비 $(awk -v a="$RAW" -v b="$WEBP" 'BEGIN { printf "%.1f", a / b }')배 작음)"
