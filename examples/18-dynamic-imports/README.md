# 18 — 동적 import와 지연 로딩

> 첫 화면에 필요 없는 코드를 분리해서 첫 로딩을 가볍게 합니다.
> 번들러의 코드 분할 지점(split point)을 `import()`로 직접 설계하는 예시입니다.

## 실행

```bash
pnpm install
node scripts/gen-big-data.mjs   # 170KB 더미 데이터 2벌 생성
pnpm dev                        # http://localhost:3000
bash scripts/compare-bundles.sh # 첫 로딩 JS 정량 비교
```

페이지 구성:

- `/` — 개요
- `/static-import` — 무거운 차트가 첫 로딩 JS에 포함되는 비교군
- `/lazy-load` — 같은 성격의 차트를 `next/dynamic`으로 분리
- `/no-ssr` — `ssr: false`로 서버 렌더링을 건너뛰는 컴포넌트
- `/benchmark` — 첫 로딩 JS 측정 결과와 재현 방법

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `app/static-import/page.tsx` | 정적 import — 차트가 첫 로딩 번들에 포함 |
| `app/lazy-load/page.tsx` + `components/lazy-chart.tsx` | `next/dynamic` — 차트가 별도 청크로 분리 |
| `components/heavy-static.tsx`, `heavy-lazy.tsx` | 각각 독립된 데이터 파일을 쓰는 무거운 차트 |
| `app/no-ssr/page.tsx` + `components/window-only-widget.tsx` | `ssr: false` — 브라우저 전용 컴포넌트 |
| `lib/big-data.ts`, `big-data-2.ts` | 번들 차이를 만드는 170KB 데이터 2벌 |
| `scripts/gen-big-data.mjs`, `compare-bundles.sh` | 데이터 생성과 번들 측정 재현 |

## 동작 원리

### 정적 import vs 동적 import — 번들이 갈라지는 지점

`import X from "./x"` 같은 **정적 import**는 모듈 그래프의 일부입니다. 번들러는
빌드 시점에 이 연결을 따라가며 도달 가능한 모든 코드를 그 페이지의 번들(청크)에
넣습니다. 페이지가 열리면 그 코드는 전부 다운로드·파싱·실행 대상입니다.

**동적 `import()`**를 만나면 번들러는 그곳을 **코드 분할 지점**으로 취급합니다.
`import()` 대상 모듈(과 그 모듈만 도달 가능한 코드)을 본체에서 떼어 **별도
청크**로 만들고, 본체에는 "필요할 때 이 청크를 요청한다"는 작은 로더만 남깁니다.
런타임에 `import()`가 실제로 호출되는 순간 브라우저가 그 청크를 네트워크로
받아옵니다.

그래서 "무거운 컴포넌트를 `dynamic(() => import(...))`로 감싸기만 하면" 그
컴포넌트와 그 컴포넌트가 끌고 오는 데이터·라이브러리가 첫 로딩 JS에서 빠집니다.

`next/dynamic`은 이 동적 import를 React 생태계에 맞게 포장한 것으로,
**`React.lazy()` + `Suspense`의 합성**입니다. App Router와 Pages Router에서
동작이 동일하도록 만들어져 있습니다. 직접 `React.lazy`와 `Suspense`를 배선하는
대신 `dynamic()` 한 줄로 같은 효과를 얻습니다.

> 참고로 App Router에서는 서버 컴포넌트가 라우트 단위로 이미 자동으로 코드
> 분할됩니다. 여기서 다루는 지연 로딩은 **클라이언트 컴포넌트**의 JS를 줄이는
> 도구입니다.

### ssr: false — 서버 렌더링 생략과 클라이언트 전용 로드

기본적으로 클라이언트 컴포넌트는 서버에서도 미리 렌더링(SSR)되어 HTML에
실립니다. 그런데 렌더 경로에서 `window`, `document` 같은 브라우저 전용 API를
직접 읽는 컴포넌트는 서버에서 실행되는 순간 오류가 납니다.

`ssr: false`는 이 컴포넌트의 **서버 렌더링을 완전히 건너뜁니다**.

- 서버 HTML에는 이 컴포넌트 자리(로딩 폴백)만 실립니다.
- 브라우저에서 청크를 받아온 뒤에야 처음 렌더링됩니다.
- 지도, 차트, 웹GL, DOM 측정이 필수인 서드파티 위젯처럼 정말 SSR이 불가능한
  경우에 사용합니다.
- 이 옵션은 **클라이언트 컴포넌트 파일에서만** 쓸 수 있습니다. 서버 컴포넌트에서
  쓰면 빌드 오류가 납니다.

`ssr: false`가 아니더라도 대부분은 `useEffect` 안에서 브라우저 값을 읽는 편이
SEO와 첫 페인트에 유리합니다. 정말 SSR이 불가능할 때만 쓰세요.

### 지연 청크는 어떻게 준비되나

분리된 청크가 필요해지는 순간 순수하게 네트워크 왕복이 발생합니다. 이 예시의
`/lazy-load`에서는 지연 청크가 첫 HTML에
`<link rel="preload" fetchPriority="low">` 힌트로 걸립니다. 초기 렌더링을 막지
않으면서 브라우저가 한가할 때 미리 받아두는 용도입니다. 즉 "첫 로딩 JS"에서는
빠져 있지만, 완전히 방치되는 것이 아니라 낮은 우선순위로 미리 준비됩니다.

### 라이브러리를 필요할 때만 import

컴포넌트뿐 아니라 라이브러리도 `import()`로 미룰 수 있습니다. 예를 들어 검색
라이브러리를 사용자가 입력을 시작한 뒤에야 불러오면, 그 라이브러리 코드는
첫 번들에서 완전히 빠집니다.

```tsx
"use client";
// 검색 라이브러리를 첫 로딩이 아닌, 첫 입력 시점에 로드
<input
  onChange={async (e) => {
    const Fuse = (await import("fuse.js")).default;
    const fuse = new Fuse(items);
    setResults(fuse.search(e.currentTarget.value));
  }}
/>
```

`fuse.js` 청크는 첫 입력 이벤트가 일어난 뒤에야 다운로드됩니다. 특정 상호작용
이후에만 필요한 무거운 라이브러리에 맞는 패턴입니다.

### `loading` 폴백과 Suspense

`next/dynamic`은 내부적으로 `React.lazy` + `Suspense`이므로, 청크가 도착하기 전
동안은 `loading`으로 지정한 컴포넌트가 그 자리를 차지합니다. 서버에서 렌더링된
페이지라면 폴백이 먼저 HTML에 실리고, 클라이언트에서 청크가 도착하는 순간 실제
컴포넌트로 교체됩니다. 폴백이 공간을 차지하고 있으면 교체 과정에서 레이아웃
이동이 생기지 않습니다.

### 매직 코멘트 (번들러 제어)

동적 `import()`에는 번들러의 처리 방식을 제어하는 매직 코멘트를 붙일 수 있습니다.

```js
// 번들링 대상에서 제외 — 런타임에 그대로 해석
const runtime = await import(/* webpackIgnore: true */ "runtime-module");

// 파일이 없을 수 있어도 빌드 오류를 억제 (Turbopack 전용, 없으면 런타임에 오류)
const plugin = await import(/* turbopackOptional: true */ "./optional-module");
```

- `webpackIgnore: true` / `turbopackIgnore: true` — 해당 import를 번들에 넣지 않고
  런타임 해석으로 남겨둡니다.
- `turbopackOptional: true` — 선택적 모듈이 없을 때의 빌드 오류를 억제합니다.
- 매직 코멘트는 동적 `import()` 표현식에만 동작하고 정적 `import` 문에는
  동작하지 않습니다.

## 코드와 함께 보는 설명

### components/lazy-chart.tsx — dynamic 배선

```tsx
// components/lazy-chart.tsx
"use client";
import dynamic from "next/dynamic";

// HeavyLazy(와 그 데이터)는 별도 청크로 분리되어,
// 이 컴포넌트가 실제로 렌더링될 때만 다운로드됩니다.
export const LazyChart = dynamic(
  () => import("@/components/heavy-lazy").then((m) => m.HeavyLazy),
  {
    loading: () => (
      <div className="card" aria-busy="true">
        <p style={{ margin: 0 }}>차트 청크를 불러오는 중…</p>
      </div>
    ),
  },
);
```

- `dynamic(() => import(...))`가 코드 분할 지점입니다. `heavy-lazy.tsx`와 그
  데이터가 별도 청크가 됩니다.
- `.then((m) => m.HeavyLazy)` — named export를 꺼내는 표준 패턴입니다.
- `loading`은 청크가 오는 동안 보여줄 폴백입니다. 폴백이 자리를 차지하므로
  레이아웃 이동 없이 부드럽게 교체됩니다.

### components/heavy-static.tsx vs heavy-lazy.tsx — 독립된 데이터

```tsx
// components/heavy-static.tsx
import { bigData, summarize } from "@/lib/big-data";

// components/heavy-lazy.tsx
import { bigData, summarize } from "@/lib/big-data-2";
```

두 차트는 같은 형태지만 **서로 다른 데이터 파일**을 import합니다. 같은
컴포넌트/데이터를 한쪽은 정적으로, 다른 쪽은 동적으로 쓰면 번들러가 그것을
공유 청크로 승격시켜 코드 분리 효과가 사라지기 때문입니다(아래 "함정" 참고).
이 분리를 가능하게 하려고 `gen-big-data.mjs`는 같은 내용의 데이터를 2벌
(`big-data.ts`, `big-data-2.ts`) 생성합니다.

### app/no-ssr/page.tsx — ssr: false

```tsx
// app/no-ssr/page.tsx
"use client";
const WindowOnlyWidget = dynamic(
  () =>
    import("@/components/window-only-widget").then((m) => m.WindowOnlyWidget),
  {
    ssr: false,
    loading: () => (
      <div className="card">
        <p style={{ margin: 0 }}>브라우저에서만 렌더링되는 위젯 로드 중…</p>
      </div>
    ),
  },
);
```

`window-only-widget.tsx`는 렌더링 즉시 `window.innerWidth`를 읽습니다. 서버에는
`window`가 없어 SSR 시 오류가 나므로, `ssr: false`로 서버 렌더링을 건너뜁니다.

### scripts/gen-big-data.mjs — 왜 데이터를 2벌 만드나

```js
// scripts/gen-big-data.mjs (발췌)
writeFileSync(join(root, "lib", "big-data.ts"), out);
// 두 번째 사본: 같은 형태지만 "다른 파일"이어야 bundler가
// 공유 청크로 승격시키지 않습니다.
writeFileSync(join(root, "lib", "big-data-2.ts"), out);
```

데이터는 2500행의 문자열 리터럴 배열입니다. 문자열 리터럴은 최소화(minify)
후에도 그대로 남아서 번들 크기에 그대로 반영됩니다. 번들 차이를 숫자로
드러내려는 의도적인 설계입니다.

### DevTools에서 직접 확인하는 법

1. `/static-import`를 열고 Network → JS: 페이지 청크 목록에 데이터가 포함된
   큰 청크가 첫 로딩에 요청되는 것을 확인합니다.
2. `/lazy-load`를 열면 첫 요청 목록에 차트 청크가 없고, 잠시 후 별도 청크
   요청이 나타납니다. HTML 소스에서는 `<link rel="preload" fetchPriority="low">`
   힌트를 찾을 수 있습니다.
3. 두 페이지의 HTML 소스에서 `<script src>` 목록을 직접 비교해도 같은 결론을
   얻을 수 있습니다. `compare-bundles.sh`가 하는 일이 바로 이 집계입니다.

## 정량 비교

### 첫 로딩 JS 측정 결과 (이 저장소에서 실제 측정, 2026-08)

각 페이지 HTML에서 실행되는 `<script src>`의 합계입니다.

| 라우트 | 방식 | 첫 로딩 JS |
| --- | --- | --- |
| `/static-import` | 정적 import | **705.6 kB** |
| `/lazy-load` | `next/dynamic` | **564.2 kB** |
| 차이 | | **141.4 kB** |

`/lazy-load`는 차트와 170KB 데이터를 첫 로딩에서 제외하고, 필요해질 때
별도 청크로 받습니다. 숫자는 압축 전 원본 크기 기준입니다.

### compare-bundles.sh로 재현하기

```bash
bash scripts/compare-bundles.sh
```

스크립트는 (1) `gen-big-data.mjs`로 데이터를 생성하고, (2) `pnpm build`로 빌드한
뒤, (3) 3118 포트에 서버를 띄웁니다. 그리고 각 페이지 HTML에서 "실행되는"
`<script src>`만 추출해 그 JS 파일들의 용량을 합산합니다. `<link rel="preload">`
힌트는 초기 렌더링을 막지 않으므로 집계에서 제외합니다. 결과는
`app/benchmark/page.tsx`의 자리표시자(`__STATIC__` 등)가 남아 있을 때만 자동으로
반영합니다. 저장소의 페이지에는 이미 측정값이 들어 있으므로, 다시 측정한 값은
터미널 출력을 보고 직접 고칩니다.

### 언제 분리하나

| 상황 | 권장 |
| --- | --- |
| 첫 화면 핵심 UI | 정적 import |
| 조건부/아래 접힌 영역(차트, 에디터, 모달) | `next/dynamic` |
| SSR 불가능한 브라우저 전용 | `dynamic` + `ssr: false` |

## 좋은 활용 사례

- 무거운 서드파티(차트, 에디터, 지도)는 항상 지연 로딩
- `loading` 폴백으로 레이아웃 유지
- 뷰포트 진입 시 로딩은 `IntersectionObserver`와 조합
- 모달·드로어처럼 "사용자가 열어야 보이는" 컴포넌트는 조건부 렌더와 함께
  `dynamic`으로 — 조건이 참이 되는 순간에만 청크를 요청합니다
- 큰 라이브러리는 컴포넌트 대신 `import()` 자체를 이벤트 핸들러 안에서 호출해
  필요 시점까지 완전히 미루기

### DX 개선

- `React.lazy` + `Suspense` 배선이 `dynamic()` 한 줄로 축소
- SSR 여부, 로딩 폴백을 옵션으로 선언

## 흔한 오해와 주의점

1. **"한 페이지는 정적, 다른 페이지는 동적으로 쓰면 자동으로 분리된다"** —
   같은 모듈을 정적+동적으로 함께 쓰면 번들러가 그것을 **공유 청크**로 만들어
   두 페이지 모두 첫 로딩에 싣습니다. 코드 분리 효과가 사라집니다. 실제로 처음
   측정했을 때 두 페이지 차이가 **-4kB(거의 없음)**였고, 독립 컴포넌트/데이터로
   바꾸자 141.4 kB 차이가 드러났습니다.
2. **"`ssr: false`를 서버 컴포넌트에서 쓸 수 있다"** — 클라이언트 컴포넌트
   파일에서만 쓸 수 있으며, 서버 컴포넌트에서 쓰면 빌드 오류가 납니다.
3. **"서버 컴포넌트를 동적 import하면 그 자체로 지연된다"** — 서버 컴포넌트를
   동적 import하면 그 자식의 클라이언트 컴포넌트만 지연 로드됩니다. 서버
   컴포넌트 자체는 서버에서 렌더링되는 것이라 클라이언트 청크 분할 대상이 아닙니다.
4. **"무조건 많이 쪼갤수록 좋다"** — 지나치게 잘게 쪼개면 요청 수와 왕복이
   늘어 오히려 느려질 수 있습니다. 정말 무겁거나 조건부인 것 위주로 분리하세요.
5. **"`loading` 폴백은 선택이니 생략해도 된다"** — 폴백이 없으면 청크가 오는
   동안 자리가 비어 레이아웃이 이동할 수 있습니다. 크기를 갖춘 폴백을 권합니다.

## 관련 문서

- [Lazy Loading — Guide](https://nextjs.org/docs/app/guides/lazy-loading)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Suspense](https://react.dev/reference/react/Suspense)
