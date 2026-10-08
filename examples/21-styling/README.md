# 21 — 스타일링

> CSS Modules + Tailwind v4를 한 앱에서 공존시키고, CSS-in-JS 선택 기준을 정리합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/css-modules` — `*.module.css` 자동 스코프
- `/tailwind` — 유틸리티 클래스
- `/css-in-js` — 런타임 vs 제로 런타임 선택 기준

홈(`/`)과 모든 페이지의 기본 외형은 전역 CSS(`app/globals.css`)가 담당합니다.

## 이 예시가 보여주는 것

| 방식 | 이 예시의 파일 | 동작 시점 | 런타임 JS 비용 |
| --- | --- | --- | --- |
| 전역 CSS | `app/globals.css` | 빌드 시 추출 | 없음 |
| CSS Modules | `components/css-modules-card.module.css` | 빌드 시 클래스명 해시 | 없음 |
| Tailwind v4 | `app/tailwind/page.tsx` + `postcss.config.mjs` | 빌드 시 사용 클래스만 생성 | 없음 |
| CSS-in-JS | `app/css-in-js/page.tsx` (개념 설명) | 라이브러리마다 다름 | 런타임 방식은 있음 |

## 동작 원리

### 1. CSS가 앱에 실리는 큰 그림

스타일의 출발점은 루트 레이아웃의 import 한 줄입니다.

```tsx
// app/layout.tsx
import "./globals.css";
```

루트 레이아웃에서 import한 CSS는 **모든 라우트에 적용**됩니다. 빌드 단계에서 Next.js가
하는 일은 공식 문서에 이렇게 정리되어 있습니다.

> In production (`next build`), all CSS files are automatically concatenated into
> **many minified and code-split** `.css` files, ensuring the minimal amount of CSS is
> loaded for a route.

즉 여러 CSS 파일은 라우트 단위로 청크가 나뉘어 압축되고, 각 라우트는 자기에게 필요한
최소한의 CSS만 로드합니다. 이 예시의 빌드 산출물에서 이 나뉨을 그대로 볼 수 있습니다.
`globals.css`와 Tailwind가 합쳐진 청크는 모든 라우트에서 로드되지만, CSS Modules
청크(358바이트)는 `/css-modules` 라우트의 출력에만 들어갑니다. 다른 페이지에 진입하면
그 카드의 스타일은 아예 로드되지 않는다는 뜻입니다.

이때 **CSS의 순서는 코드에서 import한 순서**를 따릅니다.
예를 들어 `<BaseButton>` 컴포넌트를 먼저 import하면 그 컴포넌트의 `base-button.module.css`가
`page.module.css`보다 앞에 옵니다. 그래서 "import 순서를 한곳에 모으고, 전역/Tailwind
스타일은 앱 루트에서 import하라"는 것이 공식 권장 사항입니다.

### 2. CSS Modules: 빌드 시 클래스명 해시로 스코프 격리

CSS는 원래 전역 네임스페이스라, 두 파일이 같은 클래스명을 쓰면 서로 덮어씁니다.
CSS Modules는 이 문제를 **빌드 시점 이름 바꾸기**로 풉니다.

> CSS Modules locally scope CSS by generating unique class names.

작동 순서는 이렇습니다.

1. 파일 이름이 `.module.css`로 끝나면 Next.js가 내장된 CSS Modules 처리를 적용합니다.
   (별도 설정 불필요 — 제로 설정)
2. 빌드 시 `.card` 같은 클래스 이름이 파일명과 해시를 포함한 **고유한 이름**으로
   치환됩니다. 이 예시의 빌드 산출물에서 실제 클래스명은
   `css-modules-card-module__MTGqkG__card`였습니다(파일명 + 해시 + 클래스명).
3. 컴포넌트가 `import styles from "./card.module.css"`로 받아 `styles.card`를 쓰면,
   치환된 고유 이름이 HTML에 들어갑니다.

결과적으로 같은 `card`라는 이름을 써도 파일마다 서로 다른 클래스가 되어 충돌이
불가능해집니다. 이 예시에는 이 격리를 **직접 눈으로 확인할 수 있는 장치**가 있습니다.
전역 `globals.css`에도 `.card` 클래스가 있고, CSS Module에도 `.card`가 있습니다.

```css
/* components/css-modules-card.module.css */
.card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  background: var(--card-bg);
}
```

`/css-modules` 페이지의 카드는 전역 `.card`와 이름이 같지만 module 쪽 클래스가 해시된
별개의 이름이라 서로 영향을 주지 않습니다. 이 예시의 빌드 산출물에서 직접 확인할 수
있습니다. 전역 `.card`는 그대로 `card`라는 이름으로 남아 있는 반면, module의 `.card`는
`css-modules-card-module__MTGqkG__card`로 치환되어 **별도의 CSS 파일**(358바이트 청크)로
분리되어 나갑니다.

CSS 자체는 빌드 때 추출되는 정적 파일이므로 **런타임 JS가 전혀 들지 않습니다.** 이 부분이
런타임 CSS-in-JS와의 근본적인 차이입니다.

### 3. Tailwind CSS v4: CSS 기반 설정 + 사용 클래스 수집

Tailwind는 "미리 정의된 유틸리티 클래스"를 HTML에 붙여 쓰는 방식입니다. v4의 두 가지
핵심 변화가 이 예시에 그대로 반영되어 있습니다.

**(1) 설치는 PostCSS 플러그인 + CSS import 두 줄입니다.**

```js
// postcss.config.mjs
const config = { plugins: ["@tailwindcss/postcss"] };
export default config;
```

```css
/* app/globals.css */
@import "tailwindcss";
```

Next.js가 PostCSS 파이프라인을 내장하고 있어서, 플러그인 등록만으로 빌드마다
`@tailwindcss/postcss`가 CSS를 처리합니다.

**(2) 클래스 수집: 소스 파일을 스캔해 "쓰인 클래스만" CSS를 만듭니다.**

Tailwind는 코드의 구문을 파싱하지 않습니다. 대신 **모든 소스 파일을 순수 텍스트로
읽고**, 클래스 이름에 쓰일 수 있는 글자 덩어리를 찾아낸 뒤, 실제로 사용하는 클래스에
필요한 CSS를 전부 만들어 냅니다.

> Tailwind generates all of the necessary CSS based on the classes you've actually used.

스캔 대상은 프로젝트의 모든 파일이되, `.gitignore`에 있는 파일과 `node_modules`,
바이너리 파일, CSS 파일, lock 파일은 제외됩니다. 이렇게 **실제로 사용된 클래스에 대해서만
CSS가 생성**되므로 결과물이 항상 작고, v3 시절처럼 `content` 배열이나 purge 설정으로
"어디를 스캔할지" 알려줄 필요가 없습니다.

이 예시의 빌드된 CSS를 확인하면, `tailwind/page.tsx`에서 실제로 사용한
`bg-blue-500/10`, `sm:grid-cols-3` 같은 유틸리티만 출력에 들어 있고 쓰지 않은 색
(purple 계열 같은)의 유틸리티는 존재하지 않습니다. Tailwind와 전역 CSS를 합친 청크가
11KB 남짓으로 작은 이유입니다.

단, 소스를 텍스트로만 읽기 때문에 **문자열 조립으로 클래스를 만들면 못 찾습니다.**

```tsx
// 안 됨: text-red-600라는 완성 문자열이 소스에 존재하지 않음
<div className={`text-${color}-600`} />
// 됨: 완성된 클래스명이 소스에 있어야 함
<div className={error ? "text-red-600" : "text-green-600"} />
```

**(3) 설정은 JS 파일 대신 CSS의 `@theme`으로 합니다.**

v4부터 디자인 토큰은 `tailwind.config.js`가 아니라 CSS 안의 `@theme` 블록에서
정의합니다. 네임스페이스 규칙에 따라 변수를 선언하면 그에 맞는 유틸리티가 자동으로
생성됩니다.

```css
@theme {
  --color-mint-500: oklch(0.72 0.11 178);  /* → bg-mint-500, text-mint-500 등 생성 */
  --font-poppins: Poppins, sans-serif;     /* → font-poppins 생성 */
}
```

이 예시는 기본 팔레트만으로 충분해 `@theme`을 쓰지 않지만, 전역 CSS에 정의한 디자인
토큰을 Tailwind 유틸리티로도 쓰고 싶다면 `@theme`에 CSS 변수로 등록하면 됩니다.

**(4) 전역 CSS와 공존하는 이유: `@layer`.**

Tailwind v4는 생성한 CSS를 캐스케이드 레이어(`@layer`) 안에 둡니다. CSS 캐스케이드
레이어 규칙상 **레이어 밖에 있는 스타일이 레이어 안보다 우선**합니다. 이 예시의
`globals.css`는 `@import "tailwindcss"` 뒤에 레이어 밖 커스텀 규칙(`.container`,
`.card`, `.note` 등)을 이어 쓰기 때문에, Tailwind 유틸리티와 커스텀 클래스를 섞어
써도 우선순위가 예측 가능합니다.

같은 규칙이 요소 선택자에도 적용된다는 점은 주의해야 합니다. `globals.css`의
`h2 { margin-top: 2.2rem; font-size: 1.35rem }`, `p { margin: 0.7rem 0 }`도 레이어
밖이라 유틸리티보다 우선합니다. 그래서 `app/tailwind/page.tsx`의 박스 제목에 붙은
`mt-0`, `text-lg`와 박스 문단의 `mb-0`은 실제로 적용되지 않습니다. 요소 기본
스타일을 유틸리티로 덮어쓰고 싶다면 그 규칙을 `@layer base { ... }` 안에 둡니다.

### 4. 전역 CSS의 적용 범위

공식 문서에 따르면 전역 CSS는 `app` 디렉터리 안의 아무 레이아웃/페이지/컴포넌트에서나
import할 수 있습니다. 다만 중요한 주의사항이 있습니다.

> Since Next.js uses React's built-in support for stylesheets to integrate with
> Suspense, this currently does not remove stylesheets as you navigate between routes
> which can lead to conflicts.

한 번 로드된 전역 스타일시트는 라우트를 이동해도 **제거되지 않습니다**. 그래서 전역
CSS는 이 예시처럼 **정말 전역인 것**(디자인 토큰, 리셋, 기본 타이포그래피)에만 쓰고,
컴포넌트 단위 스타일은 CSS Modules나 Tailwind로 분리하는 것이 권장됩니다. 이 예시의
`globals.css`는 CSS 변수로 디자인 토큰을 정의하고 `prefers-color-scheme`으로 다크
모드를 전환하는 패턴을 보여줍니다.

### 5. CSS-in-JS가 RSC 환경에서 까다로운 이유

CSS-in-JS는 "JS 안에서 스타일을 만들고, 렌더링 시 `<style>` 태그로 주입"하는 방식입니다.
이 전제가 App Router에서 흔들립니다.

- **서버 컴포넌트에는 런타임 JS가 없습니다.** 서버 컴포넌트는 렌더링 결과(HTML)만
  클라이언트에 보내고, 브라우저에서 실행될 JS 번들이 아예 전송되지 않습니다. 그런데
  런타임 CSS-in-JS는 "JS가 실행되면서 스타일을 계산해 주입"해야 동작합니다. 서버
  컴포넌트 트리 안에서는 그 JS 자체가 없으므로 라이브러리가 동작할 수 없습니다.
- 그래서 런타임 계열 라이브러리는 **클라이언트 컴포넌트에서만 지원**됩니다. 공식 문서도
  `app` 디렉터리에서 지원하는 라이브러리들을 "Client Components in the `app` directory"로
  명시합니다.
- SSR에서는 추가 장치가 필요합니다. 공식 문서가 설명하는 구성은 세 단계입니다.
  (1) 렌더링 중에 생긴 CSS 규칙을 모으는 **스타일 레지스트리**, (2) 콘텐츠보다 먼저
  스타일을 HTML에 끼워 넣는 `useServerInsertedHTML` 훅, (3) 이 레지스트리로 앱을 감싸는
  클라이언트 컴포넌트. styled-components는 여기에 `next.config`의
  `compiler.styledComponents: true`도 켜야 합니다.
- 스트리밍까지 가면 더 조심스럽습니다. 공식 문서는 이렇게 경고합니다.

  > Using CSS-in-JS with newer React features like Server Components and Streaming
  > requires library authors to support the latest version of React.

대안은 **제로 런타임(빌드 시 컴파일)** 계열입니다. vanilla-extract, StyleX, Panda CSS
처럼 빌드 단계에서 JS 스타일 정의를 **실제 CSS 파일로 추출**해 내는 방식은 런타임에
스타일 엔진이 필요 없으므로 서버 컴포넌트와 자연스럽게 어울립니다.

### 6. 이 예시가 CSS-in-JS를 다루는 방식

이 예시는 CSS-in-JS 라이브러리를 **설치하지 않았습니다**(`package.json`에 관련 의존성이
없습니다). 대신 `/css-in-js` 페이지에서 선택 기준 자체를 콘텐츠로 보여줍니다. 이유는
단순합니다. CSS-in-JS의 결론은 "어떤 라이브러리냐"가 아니라 "런타임이냐 제로 런타임이냐"에서
갈리고, 그 기준은 라이브러리 없이도 설명할 수 있기 때문입니다. 실제로 도입할 때는 위
5번의 레지스트리 설정(런타임 계열) 또는 빌드 플러그인(제로 런타임 계열)을 각 라이브러리
문서에 따라 추가하면 됩니다.

## 코드와 함께 보는 설명

### `app/globals.css` — 세 방식의 공통 지반

`@import "tailwindcss"` 다음에 레이어 밖 커스텀 CSS가 이어집니다. CSS 변수 블록
(`--bg`, `--fg`, `--accent` 등)이 디자인 토큰이고, `@media (prefers-color-scheme: dark)`에서
같은 변수를 재정의해 다크 모드를 만듭니다. `.container`, `.card`, `.grid`, `.note`,
`.topnav` 같은 공용 클래스도 여기 있습니다. Tailwind 유틸리티, CSS Modules, 인라인
스타일이 전부 이 토큰(`var(--border)` 등)을 공유합니다.

### `postcss.config.mjs` — Tailwind 연결

위 코드 그대로, 플러그인 한 줄입니다. `next.config.ts`는 비어 있어도 됩니다.

### `app/css-modules/page.tsx` + `components/css-modules-card.tsx`

```tsx
// components/css-modules-card.tsx
import styles from "./css-modules-card.module.css";

export function CssModulesCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>...</h3>
    </div>
  );
}
```

`styles`는 클래스명 → 해시된 이름을 매핑한 객체입니다. 페이지에는 왜 쓰는지(자동
스코프, 제로 설정, 정적) 설명과 함께 이 코드가 그대로 렌더링됩니다.

### `app/tailwind/page.tsx` — 유틸리티 클래스 실전

박스 하나를 만드는 데 필요한 전부입니다.

```tsx
<div className="rounded-xl border border-blue-400/40 bg-blue-500/10 p-5">
```

색 뒤에 붙는 `/40`, `/10`은 투명도입니다. 아래쪽 그리드는 `sm:grid-cols-3`으로
**모바일 1열 → `sm` 이상 3열** 반응형을 만듭니다. 클래스만 보면 스타일을 다 읽을 수
있다는 것이 유틸리티 퍼스트의 장점입니다.

### `app/css-in-js/page.tsx` — 선택 기준 표

런타임 / 빌드 시(제로 런타임) / 인라인 세 방식의 예시와 특징을 표로 정리한 페이지입니다.
"성능이 중요하다면 제로 런타임이나 CSS Modules/Tailwind를, 개발 경험이 중요하다면
설정을 갖춘 styled-components를"이라는 권장 문구도 함께 들어 있습니다.

## 좋은 활용 사례

- 전역 토큰/리셋: `globals.css` (이 예시의 디자인 토큰 패턴 참고)
- 컴포넌트 단위 분리: CSS Modules 또는 Tailwind 유틸리티
- 디자인 시스템: 디자인 토큰을 CSS 변수로 두고 양쪽에서 재사용
- 성능 민감 앱: 제로 런타임 CSS-in-JS 또는 CSS Modules
- 공식 권장 조합: Tailwind는 앱 루트에서 import, CSS import 순서는 한 파일에 모으기,
  모듈 파일은 `<name>.module.css` 네이밍 통일

### CSS-in-JS 선택 기준

| 방식 | 예시 | 특징 |
| --- | --- | --- |
| 런타임 | styled-components | JS로 스타일 생성/주입 — 번들·렌더 비용 |
| 제로 런타임 | vanilla-extract | 빌드 때 CSS 추출 — RSC 친화 |
| 인라인 | `style={{}}` | 동적 값엔 간편, 재사용 불가 |

### 정량 비교: 런타임 비용

| 방식 | 클라이언트 JS에 포함되는 것 |
| --- | --- |
| CSS Modules / 전역 CSS | **0** (CSS는 별도 파일) |
| Tailwind | 0 (사용한 유틸리티만 빌드 때 추출) |
| 런타임 CSS-in-JS | 스타일 엔진 + 컴포넌트별 스타일 로직 |

첫 로딩 JS와 하이드레이션 비용에서 CSS Modules/Tailwind가 유리합니다.

### DX 개선

- CSS Modules는 클래스명 충돌 걱정 없이 파일 옆에 배치 (colocation)
- Tailwind v4는 설정 파일 없이 CSS만으로 완결

## 흔한 오해와 주의점

1. **"클래스명이 같으면 어딘가에서 충돌한다" — module 클래스는 예외.** `.module.css`
   안의 클래스는 해시되어 고유해지므로, 이름이 같은 전역 클래스와도 공존합니다(이 예시의
   `.card` 두 개가 증거). 단, 전역 CSS끼리는 여전히 충돌합니다.
2. **"Tailwind 클래스를 문자열 조립해도 되겠지" — 안 됩니다.** 스캔은 텍스트 매칭이라
   `` `bg-${color}-500` ``처럼 조립한 클래스는 찾지 못합니다. 조건부라도 완성된 클래스
   문자열을 나열하세요.
3. **"전역 CSS는 페이지 이동하면 정리되겠지" — 아닙니다.** 한 번 로드된 스타일시트는
   다음 라우트에서도 남아 있어 충돌의 원인이 될 수 있습니다. 전역 CSS는 진짜 전역인
   것만 남기세요.
4. **"CSS-in-JS는 서버 컴포넌트에서도 그대로 되겠지" — 런타임 계열은 안 됩니다.**
   클라이언트 컴포넌트 + 레지스트리(`useServerInsertedHTML`) 설정이 필요하고,
   스트리밍 사용 시 라이브러리의 React 지원 수준도 확인해야 합니다.
5. **"CSS 순서는 어디서나 같겠지" — 개발과 프로덕션이 다를 수 있습니다.** 순서는 import
   순서에 따라 정해지는데, 개발 환경에서는 다르게 동작할 수 있어 공식 문서도 최종
   확인은 `next build`로 하라고 권합니다.

## 관련 문서

- [CSS-in-JS 가이드](https://nextjs.org/docs/app/guides/css-in-js)
- [CSS (Getting Started — 전역 CSS, CSS Modules)](https://nextjs.org/docs/app/getting-started/css)
- [Tailwind: Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files)
- [Tailwind: Theme variables (`@theme`)](https://tailwindcss.com/docs/theme)
- [Tailwind: Next.js 설치 가이드](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [vanilla-extract](https://vanilla-extract.style)
- [with-styled-components 공식 예시](https://github.com/vercel/next.js/tree/canary/examples/with-styled-components)
