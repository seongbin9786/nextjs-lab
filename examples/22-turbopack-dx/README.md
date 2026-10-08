# 22 — Turbopack DX

> Next.js 16의 기본 번들러. 빌드/개발 속도가 실제로 얼마나 달라지는지 직접 잽니다.

## 실행

```bash
pnpm install
bash scripts/bench.sh   # Turbopack vs webpack 빌드/dev 비교 (수 분 소요)
pnpm dev                # Turbopack dev 체험
```

프로덕션 빌드 결과를 확인하려면:

```bash
pnpm build && pnpm start
```

webpack dev와 직접 비교해 보고 싶다면 `pnpm dev --webpack`으로 두 번째 터미널에서 띄우면 됩니다(단, 같은 프로젝트의 dev 동시 실행은 16부터 락파일로 막혀 있으므로 첫 번째 dev는 먼저 내려야 합니다).

## 이 예시가 보여주는 것

| 확인할 것 | 방법 | 관찰 포인트 |
| --- | --- | --- |
| 기본 번들러가 터보팩인 사실 | `pnpm dev`, `pnpm build` | 플래그 없이 실행해도 터보팩으로 동작 |
| 프로덕션 빌드 속도 격차 | `bash scripts/bench.sh` | 이 저장소에서 2.14s vs 7.06s (3.3배) |
| dev 서버 첫 응답 속도 격차 | `bash scripts/bench.sh` | 이 저장소에서 1.42s vs 3.26s (2.3배) |
| Fast Refresh 체감 | `app/nested/page.tsx`의 문자열 수정 후 저장 | 변경 반영 시간이 터미널 로그에 표시 |
| 빌드 단계별 소요 시간 | `pnpm build` 출력 | 컴파일/타입 체크/정적 생성 등 단계별 시간 |
| dev 요청 로그 | `pnpm dev` 중 페이지 이동 | Compile/Render 시간이 분리되어 표시 |

### 순서대로 체험하기

1. `pnpm dev`를 띄우고 `http://localhost:3000`을 엽니다. 홈 페이지에 공식 발표 수치와 이 저장소의 측정값 표가 보입니다.
2. `/nested` 페이지로 이동합니다. 터미널에 이 요청의 Compile/Render 시간이 찍힙니다.
3. `app/nested/page.tsx`의 아무 문자열이나 고쳐 저장합니다. 터미널에 변경 반영 시간이 표시되고, 브라우저는 새로고침 없이 갱신됩니다.
4. `Ctrl+C`로 dev를 내리고 `pnpm build`를 실행합니다. 터미널에 단계별 소요 시간이 찍힙니다.
5. 같은 빌드를 `pnpm build --webpack`으로 다시 실행해 시간 차이를 눈으로 비교합니다.
6. 격차를 정량으로 확인하려면 `bash scripts/bench.sh`를 실행합니다.

## 동작 원리

번들러는 앱을 이루는 수많은 모듈을 브라우저가 실제로 불러올 수 있는 파일로 묶어주는 도구입니다. import 해석, 코드 변환, 청크 분리가 여기에 포함됩니다. 이 작업이 dev에서는 요청마다, 수정마다 반복되기 때문에 번들러의 속도가 곧 개발 체감 속도가 됩니다.

터보팩(Turbopack)은 **Rust로 작성된 증분(incremental) 번들러**입니다. Next.js에 내장되어 있고, Next.js 16부터 dev와 build 모두의 **기본 번들러**입니다. 왜 webpack보다 빠른지, 그리고 그 속도가 개발 경험의 어느 지점에서 느껴지는지를 하나씩 뜯어보겠습니다.

### webpack 대비 빠른 이유

공식 문서가 꼽는 설계상의 이유는 네 가지입니다.

1. **단일 통합 그래프(Unified Graph)**: Next.js는 클라이언트와 서버처럼 여러 출력 환경을 만들어야 합니다. webpack 시절에는 컴파일러 여러 개를 돌리고 그 산출물을 이어 붙이는 구조였는데, 터보팩은 모든 환경을 **하나의 그래프**로 관리합니다. 중복 작업과 이어 붙이기 비용이 사라집니다.
2. **증분 계산(Incremental Computation)**: 터보팩의 핵심입니다. 작업을 코어 전체에 병렬로 분배하고, 계산 결과를 **함수 수준까지 캐시**합니다. 한 번 끝낸 작업은 다시 하지 않으며, 그 결과는 실행 사이에도 디스크에 남습니다. "파일 하나를 고쳤을 때 전체를 다시 돌리지 않는다"가 설계 목표 자체입니다.
3. **지연 번들링(Lazy Bundling)**: dev 서버는 **실제로 요청된 것만** 번들링합니다. 아직 아무도 들어가지 않은 페이지의 코드는 컴파일하지 않으므로, 첫 컴파일 시간과 메모리 사용량이 줄어듭니다.
4. **번들링 유지(Bundling vs Native ESM)**: 브라우저의 네이티브 ESM에 맡겨 번들링을 생략하는 방식은 작은 앱에서는 빠르지만, 대형 앱에서는 모듈마다 네트워크 요청이 쏟아져 오히려 느려집니다. 터보팩은 dev에서도 번들링을 하되 대형 앱이 빠르도록 최적화된 방식으로 번들링합니다.

정리하면, 터보팩의 속도 우위는 "같은 일을 더 빠르게"가 아니라 **다시 할 일을 줄이는 구조**에서 나옵니다. Rust라는 언어 자체의 속도도 기여하지만, 더 근본적인 차이는 증분 계산과 캐시의 범위입니다.

**왜 앱이 클수록 격차가 벌어지는지도 이 구조에서 설명됩니다.** 지연 번들링이 아끼는 일은 페이지 수에 비례해 늘고, 증분 계산이 재사용하는 캐시의 비중도 모듈 그래프가 커질수록 높아집니다. 파일 시스템 캐시 공식 문서가 재시작 가속 효과가 "특히 큰 프로젝트에서" 나타난다고 못 박는 이유입니다. 작은 앱은 애초에 다시 할 일이 적어서 격차가 보수적으로 보일 수밖에 없습니다.

### dev 서버의 HMR(Fast Refresh)이 빠른 이유

개발 중 가장 자주 체감하는 속도는 저장 후 화면이 갱신되는 시간입니다. 터보팩에서 이 과정은 이렇게 흘러갑니다.

1. 파일을 저장하면 터보팩이 변경을 감지합니다. 이때 모듈 그래프와 계산 캐시는 dev 서버가 살아 있는 동안 **메모리에 유지**됩니다.
2. 증분 계산 덕분에 **무효화된 모듈과 그 영향을 받는 부분만** 다시 계산합니다. 나머지 모듈의 컴파일 결과는 캐시에서 그대로 재사용합니다.
3. 바뀐 부분만 브라우저로 전달되고, React Fast Refresh가 컴포넌트를 교체합니다. 이 과정에서 컴포넌트 상태는 유지됩니다.

"한 번 끝낸 작업은 반복하지 않는다"는 원칙이 저장마다 적용되는 셈이라, 되풀이 작업이 구조적으로 더 많은 방식일수록 앱이 클 때 격차가 벌어집니다. 공식 발표 기준 Fast Refresh는 **최대 10배** 빠릅니다. `app/nested/page.tsx`의 문자열을 고쳐 저장하면 터미널에 반영 시간이 찍히니 직접 비교해 보세요.

### 빌드 시 터보팩의 동작

`next build`도 같은 엔진이 수행합니다. dev와의 차이는 요청을 기다리며 지연 번들링하는 대신, 모든 라우트를 대상으로 전체 그래프를 완성한 뒤 프로덕션용 최적화를 적용한다는 점입니다. 설정표 기준으로 빌드 시 기본으로 켜지는 최적화에는 미니파이(`turbopackMinify`), 스코프 호이스팅(`turbopackScopeHoisting`), 사용하지 않는 내보내기 제거(`turbopackRemoveUnusedExports`) 등이 있습니다.

빌드 출력에서 컴파일과 타입 체크가 별도 단계로 찍히는 것도 이 구조의 결과입니다. 터보팩이 담당하는 것은 컴파일 단계(`Compiled successfully`)이고, 타입 체크(`Finished TypeScript`)는 그와 분리된 단계로 수행됩니다.

공식 발표 기준 프로덕션 빌드는 webpack 대비 **2~5배** 빠릅니다. 이 저장소에서 직접 잰 값은 아래 "정량 비교"에 있습니다.

여기까지를 정리하면 터보팩의 속도 개선은 세 지점에서 나타납니다. **dev 시작**(지연 번들링 + 파일 시스템 캐시), **수정 반영**(증분 계산 + 함수 수준 캐시), **프로덕션 빌드**(통합 그래프 + 빌드 최적화 기본값)입니다. 이 예시의 bench.sh는 이 중 처음과 마지막을 잽니다.

### 파일 시스템 캐시(beta)가 dev 재시작을 가속하는 원리

증분 계산의 결과가 **디스크에도 남는다면**, dev 서버를 껐다 켜도 처음부터 다시 컴파일할 필요가 없습니다. 파일 시스템 캐시가 하는 일이 정확히 이것입니다. 컴파일 산출물을 `.next` 아래에 저장해 두고, 다음 실행이 그걸 복원해서 재사용합니다.

- dev 캐시: `.next/dev/cache/turbopack` — dev 서버를 재시작하면 이전 컴파일을 재사용합니다.
- 빌드 캐시: `.next/cache/turbopack` — 다음 빌드가 웜 상태로 시작합니다.

```ts
// next.config.ts
experimental: { turbopackFileSystemCacheForDev: true }
```

Next.js 16.0에서 beta로 도입되었고, 16.1부터 dev에서, 16.3부터 빌드에서 **기본값 `true`**가 되었습니다. 즉 최신 버전에서는 위 설정을 쓰지 않아도 이미 켜져 있고, 끄고 싶을 때 `false`를 명시하면 됩니다. 앱이 클수록 재시작 절감 효과가 큽니다.

주의할 점도 있습니다. 빌드 캐시는 `.next/cache`가 다음 빌드까지 살아 있어야 의미가 있습니다. 매번 깨끗한 환경에서 시작하는 컨테이너 빌드나 CI에서 `.next/cache`를 보존하지 않는다면 캐시는 쓰기만 하고 읽히지 않습니다. 그런 환경에서는 `turbopackFileSystemCacheForBuild: false`로 캐시 작성 자체를 건너뛰는 것이 공식 문서의 권장 사항입니다.

> 참고: `scripts/bench.sh`는 dev 측정 전에만 `.next`를 통째로 지웁니다. 그래서
> dev 수치는 파일 시스템 캐시가 없는 **콜드 상태** 기준입니다. 빌드는 `.next`를
> 지우지 않고 3회 연속 실행하므로 2회차부터 `.next/cache`를 읽는 웜 빌드이고,
> 3회 중 최솟값을 채택합니다.

### 설정 없이 지원하는 것들

터보팩은 흔한 사용 사례에 대해 제로컨피그를 지향합니다. 공식 문서 기준, 이 예시처럼 설정 파일이 비어 있어도 다음이 그대로 동작합니다.

| 영역 | 내용 |
| --- | --- |
| 언어 | JavaScript/TypeScript(SWC로 처리), 최신 ECMAScript, CommonJS `require()`, ESM `import` |
| 프레임워크 | JSX/TSX, Fast Refresh, React 서버 컴포넌트의 서버/클라이언트 번들링 구분 |
| CSS | 전역 CSS, CSS Modules(Lightning CSS), CSS 네스팅, `@import`, PostCSS 설정 파일 자동 처리(Tailwind 등) |
| 에셋 | 이미지/폰트 import, JSON import |
| 모듈 해석 | `tsconfig.json`의 `paths`/`baseUrl`, `turbopack.resolveAlias`, `turbopack.resolveExtensions` |
| Babel | 16부터 설정 파일이 감지되면 자동으로 함께 사용(이전엔 하드 에러) |

### 터보팩 전용 기능

터보팩으로만 쓸 수 있는 기능도 있습니다. 반대로 `--webpack`으로 내리면 쓸 수 없어지는 것들입니다.

- **`import.meta.env`**: `DEV`, `PROD`, `MODE`, `BASE_URL`, `SSR` 같은 빌드 시점 환경 정보를 제공합니다. 정적 분석으로 `if (import.meta.env.DEV)` 같은 도달 불가 분기를 빌드에서 제거하는 데도 쓰입니다.
- **`import.meta.glob()`**: glob 패턴으로 여러 모듈을 한꺼번에 import하는 Vite 호환 API입니다. 기본은 지연 로딩(각 항목이 모듈을 반환하는 함수), `{ eager: true }`를 주면 즉시 로딩됩니다.

### webpack에서 넘어올 때 알려진 차이

문서가 명시적으로 정리한 "webpack과의 알려진 격차" 중 실무에서 자주 밟는 것들입니다.

- **webpack 플러그인 미지원**: 플러그인 시스템 자체가 없습니다. webpack 로더는 `turbopack.rules`로 일부 연결할 수 있습니다. `next.config`의 `webpack()` 설정도 인식되지 않습니다.
- **프로젝트 루트 밖 파일 미해석**: `npm link` 등으로 프로젝트 밖에 링크된 의존성은 기본적으로 해석되지 않습니다. 필요하면 `turbopack.root`를 공통 상위 디렉터리로 지정합니다.
- **CSS Modules 순서**: 별도로 순서가 정해지지 않은 CSS 모듈은 JS import 순서를 따라 배치합니다. webpack이 JS 추론 순서를 무시하던 케이스에 의존하던 앱은 미세한 렌더링 차이가 생길 수 있습니다.
- **Sass의 틸드(`~`) import 미지원**: `@import '~bootstrap/...'` 같은 webpack 전용 문법이 동작하지 않습니다. `~`를 빼거나 `resolveAlias: { '~*': '*' }`로 우회합니다.
- **CSS 소수점 정밀도**: 터보팩(Lightning CSS)은 소수 5자리, webpack은 10자리를 사용합니다. `line-height` 같은 계산 값에서 미세한 렌더링 차이가 날 수 있습니다.
- **Yarn PnP 미지원**: 지원 계획이 없습니다.
- **커스텀 Sass 함수 미지원**: `sassOptions.functions`는 Rust 기반 구조에서 JS 함수를 직접 실행할 수 없어 지원하지 않습니다.

### 버전 변화

| 버전 | 변화 |
| --- | --- |
| 15.0.0 | Turbopack dev 안정화(stable) |
| 15.3.0 | 빌드 실험 지원 시작 |
| 15.5.0 | 빌드 beta, 영속 캐시 실험 지원 |
| 16.0.0 | **기본 번들러 지정**, Babel 설정 자동 감지, 파일 시스템 캐시 beta |
| 16.1.0 | 파일 시스템 캐시 dev 기본값 켜짐 |
| 16.3.0 | 파일 시스템 캐시 빌드 기본값 켜짐 |

## 코드와 함께 보는 설명

### `package.json` — 플래그가 없는 것이 포인트

```json
// package.json (발췌)
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

터보팩이 기본이라 스크립트에 플래그가 없습니다. webpack으로 되돌아갈 때만 명시합니다.

```bash
next build               # Turbopack (기본)
next build --webpack     # 기존 webpack 커스텀 설정이 있을 때
```

### `next.config.ts` — 설정 없음이 곧 제로컨피그

이 예시의 `next.config.ts`는 빈 객체입니다. 터보팩은 흔한 사용 사례에 대해 제로컨피그를 지향하며, TypeScript/JSX/CSS/CSS Modules/PostCSS/경로 별칭(`tsconfig.json`의 `paths`) 등이 설정 없이 동작합니다. 확장이 필요할 때는 `turbopack` 키(`resolveAlias`, `resolveExtensions`, webpack 로더를 연결하는 `rules` 등)를 사용합니다.

### `scripts/bench.sh` — 측정 방식 그대로 읽기

빌드는 3회 실행 중 가장 빠른 값을 채택하고, dev는 서버 프로세스를 띄운 뒤 첫 HTTP 응답이 올 때까지의 시간을 잽니다. dev는 매 회차마다 `.next`를 지워 콜드 상태를 맞춥니다.

```bash
# scripts/bench.sh (발췌) — dev 서버 첫 응답 측정
rm -rf .next 2>/dev/null || true
"$@" -p "$PORT" >/dev/null 2>&1 &
local pid=$!
start=$(date +%s.%N)
for _ in $(seq 1 120); do
  if curl -s -o /dev/null "http://localhost:$PORT" 2>/dev/null; then break; fi
  sleep 0.2
done
end=$(date +%s.%N)
```

빌드 측정은 `date +%s.%N`으로 `next build` 전체의 벽시계 시간을 감쌉니다.

```bash
# scripts/bench.sh (발췌) — 빌드 벽시계 측정
local start end elapsed
start=$(date +%s.%N)
"$@" >/dev/null 2>&1
end=$(date +%s.%N)
elapsed=$(awk -v a="$start" -v b="$end" 'BEGIN { printf "%.2f", b - a }')
```

`next build`와 `next build --webpack`을 이 함수로 각각 3회씩 돌려 가장 빠른 값을 채택하고, dev 측정은 전용 포트(`PORT=3122`)에서 하고, 측정 전후에 그 포트를 쓰는 프로세스만 정리해 조건을 맞춥니다. 포트가 이미 사용 중이면 측정하지 않고 종료합니다. 다른 dev 서버(예: 3000번)를 실수로 재거나 죽이지 않기 위해서입니다. 마지막에 네 숫자와 배율을 요약표로 출력합니다.

### `app/nested/page.tsx` — Fast Refresh 체감용 타깃

카드 20개를 그리는 단순한 페이지입니다. `pnpm dev`를 띄우고 이 파일의 아무 문자열이나 고쳐 저장하면, 변경이 반영되는 시간이 터미널 로그에 표시됩니다. 같은 파일을 `pnpm dev --webpack`으로 띄웠을 때와 비교하면 수정 반영 속도의 차이를 체감할 수 있습니다.

### `app/page.tsx` — 문서에 나온 숫자를 화면으로

홈 페이지는 공식 발표 수치(빌드 2~5배, Fast Refresh 최대 10배)와 이 저장소에서 잰 측정값을 표로 보여주는 서버 컴포넌트입니다. 이 README의 숫자와 화면의 숫자는 같은 출처입니다.

## 정량 비교

이 예시는 "터보팩이 빠르다"를 인용이 아니라 측정으로 보여주는 것이 목표입니다. 아래 숫자는 모두 이 저장소에서 `scripts/bench.sh`로 직접 잰 값입니다.

### 이 저장소에서 직접 잰 값 (2026-08, 아주 작은 앱)

| 측정 | Turbopack | webpack | 배율 |
| --- | --- | --- | --- |
| 프로덕션 빌드 (3회 중 최소) | **2.14s** | 7.06s | 3.3배 |
| dev 서버 첫 응답 | **1.42s** | 3.26s | 2.3배 |

작은 앱이라 격차가 보수적으로 나왔습니다.

이 숫자들은 **콜드 상태**(매 측정 전 `.next` 삭제) 기준이라는 점을 함께 기억해 주세요. 파일 시스템 캐시가 켜진 채 dev를 재시작하는 웜 시나리오에서는 Turbopack 쪽 숫자가 여기서 더 좋아지는 방향입니다. 즉 이 표의 배율은 터보팩의 하한에 가깝습니다.

공식 발표 기준:

| 항목 | webpack 대비 |
| --- | --- |
| 프로덕션 빌드 | **2~5배** |
| Fast Refresh | **최대 10배** |
| dev 시작 (대형 앱) | 파일 시스템 캐시로 재시작 가속 |

### 정량 측정 시 주의

- 앱이 클수록 격차가 벌어집니다
- 측정 환경(CPU, 디스크, 캐시 상태)에 따라 절대값은 달라질 수 있습니다
- `scripts/bench.sh`는 dev 측정 때마다 `.next`를 지우고 dev를 재시작해 측정합니다. 빌드 측정은 `.next`를 지우지 않습니다
- 위 dev 수치는 "서버 프로세스 시작 → 첫 HTTP 응답 성공"까지의 시간이며, 여기에는 요청된 페이지의 컴파일이 포함됩니다

### `bench.sh`가 출력하는 요약

스크립트를 끝까지 돌리면 마지막에 이런 요약이 찍힙니다(숫자는 실행 환경마다 다릅니다).

```text
================ 결과 ================
빌드 (Turbopack): 2.14s
빌드 (webpack):   7.06s  (3.3배)
dev 첫 응답 (Turbopack): 1.42s
dev 첫 응답 (webpack): 3.26s
======================================

참고: 앱 규모가 클수록 격차는 더 벌어집니다. (공식 발표: 빌드 2~5배,
Fast Refresh 최대 10배) 이 예시는 아주 작은 앱이라 격차가 보수적으로
측정된 것입니다.
```

측정 중간에는 각 빌드의 1~3차 시도 시간과 dev 첫 응답 시간이 순서대로 표시됩니다. 특정 측정값이 튀었다면 이 중간 출력에서 어느 회차였는지 확인할 수 있습니다.

## 함께 온 DX 개선들

Next.js 16은 터보팩 기본화와 함께 개발 경험 전반을 다듬었습니다.

- **빌드 단계별 소요 시간 표시**: 컴파일, 타입 체크, 정적 생성 등 각 단계 시간이 터미널에 나옵니다. 어느 단계가 병목인지 바로 보입니다.

  ```
  ✓ Compiled successfully in 615ms
  ✓ Finished TypeScript in 1114ms
  ✓ Collecting page data in 208ms
  ✓ Generating static pages in 239ms
  ```

- **개발 요청 로그**: dev에서 페이지를 요청하면 Compile 시간과 Render 시간이 분리되어 느린 지점을 찾기 쉬워졌습니다. Compile은 라우팅과 컴파일, Render는 내 코드 실행과 React 렌더링 구간을 뜻합니다.
- **동시 실행 보호**: 같은 프로젝트에서 `next dev` 두 개가 동시에 뜨지 않도록 락파일이 생겼습니다. 실수로 두 번째 터미널에 dev를 띄워 포트가 꼬이는 사고를 막습니다.
- **dev/build 출력 디렉터리 분리**: dev 서버를 띄운 채 `next build`를 돌려도 서로 충돌하지 않습니다.
- **Babel 설정 자동 감지**: Babel 설정 파일이 있으면 터보팩이 자동으로 Babel을 함께 사용합니다. 이전 버전에서는 하드 에러로 죽던 상황이었습니다. 다만 webpack과 달리 Next.js 내부 변환에는 항상 SWC가 쓰입니다.
- **터미널 출력 재설계**: 16부터 빌드/에러 출력 포맷이 정리되어 에러 메시지가 더 명확해지고 성능 지표 표시가 개선되었습니다.

이 개선들은 터보팩 자체의 기능이 아니라 Next.js 16에 함께 실려 온 변화들이지만, "도구를 바꿨더니 하루 종일 보는 터미널이 읽기 쉬워졌다"는 의미에서 DX의 일부입니다.

## 좋은 활용 사례

- **새 프로젝트**: 아무것도 하지 않는 것이 최적입니다. `next dev`, `next build`가 그대로 터보팩으로 동작합니다.
- **대형 앱**: 격차가 가장 극적으로 벌어지는 구간입니다. 2~5배 빌드, 최대 10배 Fast Refresh가 체감되는 규모입니다.
- **dev 서버 재시작이 잦은 워크플로**: 파일 시스템 캐시가 켜져 있으므로 재시작 후 첫 컴파일이 눈에 띄게 빠릅니다.
- **CI 빌드**: `.next/cache`를 CI 캐시로 보존하도록 설정하면 빌드가 웜 상태로 시작합니다. 반대로 캐시를 보존하지 않는 환경에서는 `turbopackFileSystemCacheForBuild: false`로 불필요한 캐시 작성을 끕니다.
- **webpack이 꼭 필요한 경우에만 `--webpack`**: webpack 플러그인 생태계에 의존하거나, `sassOptions.functions` 같은 JS 기반 Sass 함수가 필요하거나, Yarn PnP를 쓰는 경우입니다. 프로젝트 루트 밖의 링크된 의존성(`npm link` 등)을 해결해야 한다면 `--webpack` 대신 `turbopack.root` 설정으로 해결할 수도 있습니다.
- **기존 프로젝트 마이그레이션**: 이 예시의 `bench.sh` 같은 방식으로 먼저 자기 앱의 격차를 직접 잰 뒤, 위 "webpack에서 넘어올 때 알려진 차이" 목록을 훑고, 걸리는 지점이 있는 앱만 골라 `--webpack`으로 남기는 순서가 안전합니다.
- **dev 재시작이 잦은 대형 저장소**: 파일 시스템 캐시가 dev에서 기본으로 켜져 있으므로, 의존성 설치나 브랜치 전환 후 첫 `next dev`의 컴파일 비용이 크게 줄어듭니다.

## 흔한 오해와 주의점

숫자와 설정을 읽을 때 빠지기 쉬운 오해들을 모았습니다.

1. **"터보팩은 dev 전용 도구다"**: 아닙니다. Next.js 16에서 터보팩은 dev와 **프로덕션 빌드 모두**에서 안정화되었고 기본값입니다. 빌드 속도 개선(2~5배)이 dev 개선보다 더 큰 프로젝트도 많습니다.
2. **절대 숫자에 의미를 부여하기**: 이 예시의 2.14s, 1.42s는 아주 작은 앱을 특정 환경에서 잰 값입니다. 환경(CPU, 디스크, 캐시 상태)과 앱 규모에 따라 절대값은 얼마든지 달라지며, 봐야 할 것은 상대적 격차와 그 격차가 규모와 함께 벌어지는 방향입니다.
3. **"파일 시스템 캐시는 CI에서도 알아서 이득이다"**: 캐시는 `.next/cache`가 다음 실행까지 남아 있을 때만 읽힙니다. 컨테이너나 CI가 매번 깨끗한 환경이라면 캐시는 쓰기만 되고 읽히지 않으니, 보존 설정을 하거나 플래그를 끄는 판단이 필요합니다.
4. **"기존 `webpack()` 설정이 그대로 적용될 것이다"**: 터보팩은 webpack을 대체하므로 `next.config`의 `webpack()` 설정은 인식되지 않습니다. webpack 플러그인도 지원하지 않습니다. webpack 로더는 `turbopack.rules`로 일부 연결할 수 있고, 별칭과 확장자는 `turbopack.resolveAlias` / `turbopack.resolveExtensions`로 옮기면 됩니다.
5. **"번들러가 타입 체크까지 해줄 것이다"**: 터보팩은 SWC로 변환만 하고 타입 체크는 하지 않습니다. 타입 확인은 `tsc --watch`나 IDE에 맡기는 구조이며, 빌드에서 타입 체크 시간이 따로 표시되는 것도 이 때문입니다.

## 관련 문서

- [Turbopack](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack)
- [Next.js 16 릴리스 노트](https://nextjs.org/blog/next-16)
- [Turbopack 개요 (API Reference)](https://nextjs.org/docs/app/api-reference/turbopack)
- [Turbopack FileSystem Caching](https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopackFileSystemCache)
- [Turbo 공식 사이트](https://turbo.build/pack)
