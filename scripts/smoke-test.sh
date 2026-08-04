#!/usr/bin/env bash
# 모든 예시를 프로덕션 서버로 띄우고 실제로 응답하는지 확인합니다.
# (빌드 검증과 별개로, 런타임 동작을 검사합니다.)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=3200
FAILED=()
PASSED=0

# 정적 export 예시는 next start 대신 out/ 산출물을 확인합니다.
if [ -d "$ROOT/examples/24-static-export" ]; then
  echo "==> [24-static-export] out/ 산출물 확인 (정적 export는 서버 없음)"
  if [ ! -d "$ROOT/examples/24-static-export/.next" ]; then
    (cd "$ROOT/examples/24-static-export" && pnpm install --silent >/dev/null 2>&1 && pnpm build >/dev/null 2>&1)
  fi
  if [ -f "$ROOT/examples/24-static-export/out/index.html" ]; then
    echo "    ✓ out/index.html 존재"
    PASSED=$((PASSED + 1))
  else
    echo "    ✗ out/index.html 없음"
    FAILED+=("24-static-export")
  fi
fi

for dir in "$ROOT"/examples/*/; do
  name="$(basename "$dir")"
  [ "$name" = "24-static-export" ] && continue

  PORT=$((PORT + 1))
  echo "==> [$name] :$PORT"

  # 빌드가 없으면 먼저 빌드
  if [ ! -d "$dir/.next" ]; then
    (cd "$dir" && pnpm install --silent >/dev/null 2>&1 && pnpm build >/dev/null 2>&1)
  fi

  (cd "$dir" && exec pnpm start -p "$PORT" >/dev/null 2>&1) &
  SERVER_PID=$!

  # 서버 준비 대기 (최대 20초)
  ready=""
  for _ in $(seq 1 40); do
    code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || true)
    if [ "$code" = "200" ] || [ "$code" = "307" ] || [ "$code" = "308" ]; then
      ready="$code"
      break
    fi
    sleep 0.5
  done

  if [ -n "$ready" ]; then
    echo "    ✓ HTTP $ready"
    PASSED=$((PASSED + 1))
  else
    echo "    ✗ 응답 없음 (마지막 코드: ${code:-없음})"
    FAILED+=("$name")
  fi

  kill "$SERVER_PID" >/dev/null 2>&1 || true
  # next 서버 자식 프로세스 정리
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 >/dev/null 2>&1 || true
  sleep 0.3
done

echo ""
echo "======================================"
echo "통과: $PASSED / 실패: ${#FAILED[@]}"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "실패 목록: ${FAILED[*]}"
  exit 1
fi
echo "모든 예시가 실제로 응답했습니다."
