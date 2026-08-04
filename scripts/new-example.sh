#!/usr/bin/env bash
# 사용법: ./scripts/new-example.sh <예시 디렉터리 이름> "<타이틀>"
# 예: ./scripts/new-example.sh 01-app-router-basics "App Router 기본기"
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$DIR")"
NAME="${1:?예시 디렉터리 이름 필요 (예: 01-app-router-basics)}"
TITLE="${2:-$NAME}"
TARGET="$ROOT/examples/$NAME"
mkdir -p "$ROOT/examples"

if [ -d "$TARGET" ]; then
  echo "이미 존재: $TARGET" >&2
  exit 1
fi

cp -R "$DIR/template" "$TARGET"

if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|__NAME__|$NAME|g" "$TARGET/package.json"
  sed -i '' "s|__TITLE__|$TITLE|g" "$TARGET/app/layout.tsx"
else
  sed -i "s|__NAME__|$NAME|g" "$TARGET/package.json"
  sed -i "s|__TITLE__|$TITLE|g" "$TARGET/app/layout.tsx"
fi

echo "생성 완료: $TARGET"
