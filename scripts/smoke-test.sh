#!/usr/bin/env bash
# 모든 예시를 프로덕션 서버로 띄우고 실제로 응답하는지 확인합니다.
# (빌드 검증과 별개로, 런타임 동작을 검사합니다.)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT=3200
FAILED=()
PASSED=0
SERVER_PID=""
LOG="$(mktemp -t nextjs-lab-smoke.XXXXXX)"

port_in_use() {
  lsof -ti tcp:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

stop_server() {
  [ -n "$SERVER_PID" ] || return 0
  kill "$SERVER_PID" >/dev/null 2>&1 || true
  # pnpm이 띄운 next 서버 자식 프로세스 정리
  # (시작 전에 빈 포트임을 확인했으므로 이 포트의 리스너는 이 스크립트가 띄운 것입니다.)
  lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | xargs kill -9 >/dev/null 2>&1 || true
  SERVER_PID=""
}
trap 'stop_server; rm -f "$LOG"' EXIT
trap 'exit 130' INT TERM

# 의존성/빌드 산출물이 없으면 준비합니다. $2는 "빌드 완료"를 판단할 파일입니다.
# `.next` 디렉터리는 `next dev`도 만들기 때문에 빌드 여부 판단에 쓸 수 없습니다.
ensure_built() {
  local dir="$1" marker="$2"
  if [ ! -d "$dir/node_modules" ]; then
    if ! (cd "$dir" && pnpm install --silent) >"$LOG" 2>&1; then
      echo "    ✗ pnpm install 실패"; tail -20 "$LOG" | sed 's/^/      /'
      return 1
    fi
  fi
  if [ ! -f "$dir/$marker" ]; then
    echo "    (빌드 없음 → pnpm build)"
    if ! (cd "$dir" && pnpm build) >"$LOG" 2>&1; then
      echo "    ✗ pnpm build 실패"; tail -20 "$LOG" | sed 's/^/      /'
      return 1
    fi
  fi
}

# 정적 export 예시는 next start 대신 out/ 산출물을 확인합니다.
STATIC="$ROOT/examples/24-static-export"
if [ -d "$STATIC" ]; then
  echo "==> [24-static-export] out/ 산출물 확인 (정적 export는 서버 없음)"
  if ensure_built "$STATIC" "out/index.html" && [ -f "$STATIC/out/index.html" ]; then
    echo "    ✓ out/index.html 존재"
    PASSED=$((PASSED + 1))
  else
    echo "    ✗ out/index.html 없음"
    FAILED+=("24-static-export")
  fi
fi

for dir in "$ROOT"/examples/*/; do
  dir="${dir%/}"
  name="$(basename "$dir")"
  [ "$name" = "24-static-export" ] && continue

  # 다른 프로세스가 쓰는 포트는 건너뜁니다. (잘못된 서버에 요청하거나,
  # 정리 단계에서 무관한 프로세스를 죽이지 않도록)
  PORT=$((PORT + 1))
  while port_in_use "$PORT"; do PORT=$((PORT + 1)); done
  echo "==> [$name] :$PORT"

  if ! ensure_built "$dir" ".next/BUILD_ID"; then
    FAILED+=("$name")
    continue
  fi

  (cd "$dir" && exec pnpm start -p "$PORT" >/dev/null 2>&1) &
  SERVER_PID=$!

  # 서버 준비 대기 (최대 20초)
  ready=""
  code=""
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

  stop_server
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
