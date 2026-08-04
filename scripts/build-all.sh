#!/usr/bin/env bash
# 모든 예시를 프로덕션 빌드하여 검증합니다.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FAILED=()

for dir in "$ROOT"/examples/*/; do
  name="$(basename "$dir")"
  echo ""
  echo "==> [$name] pnpm build"
  if ! (cd "$dir" && pnpm build); then
    FAILED+=("$name")
  fi
done

echo ""
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "빌드 실패: ${FAILED[*]}"
  exit 1
fi
echo "모든 예시 빌드 성공"
