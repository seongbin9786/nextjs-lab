#!/usr/bin/env bash
# 저장소의 모든 정량 벤치를 순서대로 실행합니다. (수 분 소요)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

run() {
  local name="$1"; local dir="$2"; local script="$3"
  echo ""
  echo "########################################"
  echo "# $name"
  echo "########################################"
  (cd "$ROOT/$dir" && bash "$script") || echo "($name 실행 실패)"
}

run "03 서버 합성 vs 전부 클라이언트 번들" "examples/03-server-client-components" "scripts/compare-bundles.sh"
run "04 스트리밍 TTFB" "examples/04-streaming-suspense" "scripts/bench.sh"
run "05 데이터 캐시 TTFB" "examples/05-data-fetching-caching" "scripts/bench.sh"
run "10 이미지 전송량" "examples/10-image-optimization" "scripts/bench.sh"
run "18 지연 로딩 번들" "examples/18-dynamic-imports" "scripts/compare-bundles.sh"
run "22 Turbopack vs webpack" "examples/22-turbopack-dx" "scripts/bench.sh"

# 서버 정리는 각 벤치 스크립트가 자기 포트(3104/3110/3118/3122/3125/3126)
# 기준으로 직접 합니다. 여기서 프로세스 이름으로 pkill 하면 사용자가 따로
# 띄운 무관한 Next.js 서버까지 죽으므로 하지 않습니다.

echo ""
echo "모든 벤치 완료."
