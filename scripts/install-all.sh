#!/usr/bin/env bash
# 모든 예시의 의존성을 설치합니다. (pnpm store 공유로 두 번째부터 빠름)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=()

for dir in "$ROOT"/examples/*/; do
  name="$(basename "$dir")"
  echo ""
  echo "==> [$name] pnpm install"
  if ! (cd "$dir" && pnpm install --silent); then
    FAILED+=("$name")
  fi
done

echo ""
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "설치 실패: ${FAILED[*]}"
  exit 1
fi
echo "모든 예시 설치 완료"
