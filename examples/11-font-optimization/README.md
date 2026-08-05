# 11 — 폰트 최적화 (next/font)

> 웹 폰트 자체 호스팅 + 레이아웃 이동(CLS) 제거 + 외부 요청 0개.
> 폰트 로딩의 고전적인 문제(직렬 요청, FOUT/FOIT, 레이아웃 출렁임)를 빌드 시점에 해결합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` — `next/font/local`로 IBM Plex Sans KR 로드 (외부 요청 0)
- `/how` — 빌드 시 일어나는 일, CLS 제거 원리
- `/cdn` — 고전 방식(`<link>` 구글 Fonts)과의 비교

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `app/layout.tsx` | `localFont()` 호출과 CSS 변수(`variable`) 적용 |
| `public/fonts/ibm-plex-sans-kr-400.woff2` | 자체 호스팅하는 폰트 파일 (약 4.5KB) |
| `app/page.tsx` | `var(--font-plex)`로 폰트 적용 |
| `app/how/page.tsx` | 빌드 시 일어나는 일과 요청 수 비교 표 |
| `app/cdn/page.tsx` | `<link>` 기반 구글 Fonts 고전 방식 비교군 |

## 동작 원리

`next/font`의 핵심은 **런타임이 아니라 빌드 시점에 동작한다**는 것입니다.
`localFont()`이나 `Noto_Sans_KR()` 같은 호출은 브라우저에서 실행되는 코드가
아니라, 빌드 도구가 해석해서 CSS와 정적 에셋으로 바꿔놓는 지시문입니다.

### 빌드 시 일어나는 일

1. **폰트 파일 확보**
   - `next/font/google`이면 빌드 때 구글 서버에서 CSS와 폰트 파일을
     **다운로드**해 `.next` 정적 에셋으로 저장합니다. 런타임에 브라우저가
     구글로 보내는 요청은 0개가 됩니다.
   - `next/font/local`이면 프로젝트 안의 파일(이 예시의
     `public/fonts/ibm-plex-sans-kr-400.woff2`)을 그대로 에셋으로 복사합니다.
2. **CSS 생성**
   - 폰트를 선언하는 `@font-face` 규칙을 자동 생성합니다. `display`, `weight`,
     `style` 등 옵션이 여기에 반영됩니다.
   - 동시에 **폴백 폰트 메트릭 보정** CSS를 생성합니다 (아래 "CLS 제거" 참고).
   - 이 CSS는 HTML에 함께 실리므로, 폰트 CSS를 가져오기 위한 별도 왕복이 없습니다.
3. **preload 힌트 삽입**
   - 첫 화면에 필요한 폰트 파일은 `<link rel="preload">`로 HTML에 함께 실립니다.
     브라우저가 HTML을 파싱하자마자 폰트 다운로드를 시작합니다.
   - preload 범위는 폰트를 호출한 위치를 따릅니다: 개별 페이지면 그 라우트,
     레이아웃이면 그 레이아웃 아래 라우트, **루트 레이아웃이면 모든 라우트**.
     이 예시는 루트 레이아웃에서 호출하므로 전역 preload입니다.

결과적으로 "외부 origin 요청 0개 + 폰트 발견이 HTML과 동시에(병렬)"가 됩니다.
게다가 클라이언트 JS 비용도 0입니다. 생성되는 것은 순수 CSS뿐이라
hydration 이후에도 폰트 관련 자바스크립트가 실행되지 않습니다.

### 왜 CLS가 사라지나 — FOUT/FOIT와 메트릭 보정

웹 폰트가 늦게 도착하면 브라우저는 두 가지 방식으로 반응합니다.

- **FOIT** (Flash of Invisible Text): 웹 폰트가 올 때까지 텍스트를 보이지 않게
  둡니다. 사용자는 빈 화면을 봅니다.
- **FOUT** (Flash of Unstyled Text): 일단 폴백(시스템) 폰트로 보여주고, 웹 폰트가
  도착하면 갈아끼웁니다. 사용자는 텍스트를 빨리 보지만, **교체 순간 두 폰트의
  글자 너비·줄 높이가 달라 레이아웃이 움직입니다.** 이것이 폰트발 CLS입니다.

`font-display: swap`은 FOIT 대신 FOUT를 선택합니다(보이는 게 먼저). 하지만
swap만으로는 교체 순간의 레이아웃 이동은 막지 못합니다.

`next/font`는 여기서 한 발 더 나갑니다. **폴백 폰트에 보정 descriptors를
적용해서 웹 폰트와 차지하는 공간을 거의 같게** 만듭니다.

- `size-adjust` — 폴백 폰트의 글자 너비를 웹 폰트에 맞춰 확대/축소
- `ascent-override`, `descent-override`, `line-gap-override` — 줄 높이(위쪽 여백,
  아래쪽 여백, 줄 간격)를 웹 폰트 메트릭에 맞춰 보정

이 보정 덕분에 폴백으로 그렸을 때와 웹 폰트로 갈아끼웠을 때 텍스트 블록의
크기가 거의 동일해서, **교체가 일어나도 레이아웃이 흔들리지 않습니다.**
web.dev의 CLS 가이드가 폰트발 레이아웃 이동을 줄이는 방법으로 정확히 이
descriptor들을 권고합니다.

보정은 `adjustFontFallback` 옵션이 제어합니다. CLS를 줄이기 위한 자동 폴백
생성을 켜고 끕니다.

- `next/font/google`: 기본 `true`. 껐다가(`false`) 레이아웃이 흔들리면 다시 켜면 됩니다.
- `next/font/local`: 기본 `'Arial'`(산세리프 기준). 세리프 폰트라면
  `'Times New Roman'`으로 바꾸거나 `false`로 끌 수 있습니다.

### CSS 변수로 폰트를 재사용하는 패턴

`next/font` 호출 결과는 세 가지로 적용할 수 있습니다.

- `className` — 생성된 클래스를 요소에 직접 붙임
- `style` — 인라인 스타일 객체 (`fontFamily` 포함)
- `variable` + CSS 변수 — CSS 어디에서든 `var(--폰트이름)`으로 재사용

세 번째가 이 예시의 방식입니다. `variable: "--font-plex"`를 주면 `plex.variable`
값이 생기고, 이것을 `<html>`의 `className`으로 붙여 전역에 변수를 선언합니다.
이후 CSS나 인라인 스타일에서 `var(--font-plex)`로 폰트를 재사용합니다.
Tailwind처럼 CSS 변수 기반 테마를 쓰는 도구와 특히 잘 맞습니다.

```tsx
// className 방식 — 생성된 클래스를 직접 붙임
<p className={plex.className}>IBM Plex Sans KR 텍스트</p>

// style 방식 — fontFamily를 포함한 인라인 스타일 객체
<p style={plex.style}>IBM Plex Sans KR 텍스트</p>

// CSS 변수 방식 (이 예시) — 아무 CSS에서나 var()로 재사용
<h1 style={{ fontFamily: "var(--font-plex), sans-serif" }}>제목</h1>
```

여러 폰트를 섞어 쓸 때(본문 + 코드 폰트 등)는 `<html>`에 변수 여러 개를 걸고
CSS에서 조합하는 방식이 가장 깔끔합니다.

> 폰트 함수를 여러 번 호출하면 그 수만큼 폰트 인스턴스가 호스팅됩니다.
> 같은 폰트를 여러 곳에서 쓸 때는 한 곳(예: `fonts.ts`)에서 한 번만 호출하고
> 그 객체를 import해 재사용하는 것이 좋습니다.

### 전체 시퀀스 (타임라인)

이 예시의 홈 페이지에서 실제로 일어나는 순서는 이렇습니다.

1. HTML 도착 — 폰트 `@font-face` CSS가 이미 HTML에 포함되어 있음 (CSS 요청 없음)
2. 브라우저가 preload 힌트를 보고 같은 origin의 woff2 다운로드 시작
3. 그 사이 텍스트는 메트릭이 보정된 폴백 폰트로 표시 (`font-display: swap`)
4. woff2 도착 → 웹 폰트로 교체 — 두 폰트의 차지 공간이 거의 같아 이동 없음

고전 방식(`app/cdn/page.tsx`)은 1번에서 외부 CSS 왕복이 추가되고, 2번이 그 CSS
도착 이후에야 시작되는 직렬 구조입니다.

## 코드와 함께 보는 설명

### app/layout.tsx — 폰트 선언과 전역 적용

```tsx
// app/layout.tsx
import localFont from "next/font/local";

// next/font/local: 빌드 시 폰트 파일을 앱에 포함시키고
// @font-face CSS를 자동 생성합니다. 외부 요청이 전혀 없습니다.
const plex = localFont({
  src: "../public/fonts/ibm-plex-sans-kr-400.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-plex",
});

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- `src`는 이 파일을 기준으로 한 상대 경로입니다. 폰트 파일은 `public/`이든
  `app/`이든 어디에 두어도 됩니다.
- `display: "swap"` — `font-display: swap`으로 생성되어 폴백이 먼저 표시됩니다.
  (참고: `next/font`의 기본값도 `swap`입니다.)
- `variable: "--font-plex"` — CSS 변수를 생성하고, `plex.variable`을 `<html>`에
  붙여 전역에서 쓸 수 있게 합니다.
- 루트 레이아웃에서 호출했으므로 이 폰트는 **모든 라우트에서 preload**됩니다.

### app/page.tsx — 변수로 폰트 적용

```tsx
// app/page.tsx
<h1 style={{ fontFamily: "var(--font-plex), sans-serif" }}>
  폰트 최적화 (next/font)
</h1>
```

`plex.className`을 직접 붙이는 대신 CSS 변수를 사용했습니다. 변수 방식은
전역 CSS나 컴포넌트 CSS에서 폰트를 조합할 때(예: `font-family: var(--font-plex),
sans-serif`) 유용합니다.

### app/cdn/page.tsx — 고전 방식 비교군

```tsx
// app/cdn/page.tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

이 페이지는 의도적으로 고전 방식을 사용합니다. DevTools → Network를 열면
`fonts.googleapis.com`(CSS)과 `fonts.gstatic.com`(woff2) 요청이 보입니다.
홈 페이지에는 이 요청이 없습니다.

> 참고: `next/font/google`을 쓰면 같은 Noto Sans KR이라도 빌드 때 파일을 받아
> 자체 호스팅하므로, 런타임에는 위 요청 자체가 사라집니다.

```tsx
import { Noto_Sans_KR } from "next/font/google";
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700"] });
// 빌드 때 폰트 파일을 다운로드해 내 앱에 포함 — 런타임에 외부 요청 없음
```

`subsets`는 preload 대상 서브셋을 선언하는 옵션입니다. `preload: true`(기본)에서
서브셋을 지정하지 않으면 경고를 받습니다. 한글처럼 글리프가 많은 폰트는 필요한
서브셋만 고르는 것이 용량에 유리합니다.

### DevTools에서 직접 확인하는 법

1. **Network → Font**: 홈 페이지에서는 `.woff2` 요청이 하나만 보이고, 도메인이
   이 앱 자신(같은 origin)입니다. `fonts.googleapis.com`, `fonts.gstatic.com`
   요청은 없습니다. `/cdn` 페이지에서는 그 두 도메인의 요청이 나타납니다.
2. **Elements**: `<html>`에 `plex.variable`이 만든 클래스가 붙어 있고, 그 클래스에
   적용된 CSS를 열어보면 `font-display: swap`이 선언된 원래 폰트의 `@font-face`와
   `size-adjust` 등 보정 descriptors가 붙은 폴백 `@font-face`가 함께 생성된 것을
   볼 수 있습니다.
3. **Performance**: 느린 네트워크로 제한한 뒤 새로고침해도, 폴백 → 웹 폰트 교체
   순간의 레이아웃 이동이 거의 없음을 타임라인에서 확인할 수 있습니다.

## 정량 비교

### 로딩 방식 비교

| 방식 | 외부 origin 요청 | 폰트 발견 시점 |
| --- | --- | --- |
| `<link>` 구글 Fonts | **2회+** (CSS → woff2, 직렬) | CSS 도착 후 |
| `@font-face` 직접 작성 | 1회+ (폰트 자체 서빙, CSS는 수동 관리) | CSS 파싱 후 |
| `next/font` | **0회** (폰트는 같은 origin) | HTML과 함께 preload (병렬) |

`/cdn` 페이지와 홈을 각각 DevTools → Network로 비교하면
`fonts.googleapis.com`, `fonts.gstatic.com` 요청 유무가 갈립니다.

### 고전 방식에서 일어나는 일 (직렬 체인)

`app/cdn/page.tsx` 기준:

1. HTML 도착 → `fonts.googleapis.com`에서 **CSS를 요청** (외부 1회, 왕복 발생)
2. 그 CSS를 파싱한 뒤에야 폰트 파일 URL을 알고 `fonts.gstatic.com`에서
   **woff2를 요청** (외부 2회)
3. 그 사이 브라우저는 폴백 폰트로 표시 → 폰트 도착 시 교체 → **CLS 발생 가능**

`next/font`는 1번(CSS)이 HTML에 이미 들어 있고, 2번(woff2)은 preload로 HTML과
함께 발견되므로 직렬 체인이 없습니다.

| | 이 예시 `/cdn` (CDN) | 홈 (next/font) |
| --- | --- | --- |
| 외부 origin 요청 | 2개 이상 (CSS + 폰트) | 0개 |
| 폰트 발견 시점 | CSS 도착 후 (직렬) | HTML과 함께 preload (병렬) |
| 개인정보/추적 | CDN이 IP 수집 가능 | 자체 호스팅으로 없음 |
| 오프라인/방화벽 | CDN 차단 시 깨짐 | 영향 없음 |

## 좋은 활용 사례

- 본문 폰트는 `next/font/google`의 자체 호스팅 (개인정보/방화벽 이슈도 줄음)
- `variable`로 CSS 변수화해 전역에서 재사용 (Tailwind 테마와 조합)
- 한글 폰트는 파일이 크므로 필요한 weight만 선택 (400/700 정도)
- 같은 폰트는 한 파일(예: `fonts.ts`)에서 한 번만 선언하고 import로 공유 —
  호출할 때마다 별도 인스턴스로 호스팅됩니다
- 변수 폰트(variable font)를 쓰면 weight 축 하나를 여러 굵기로 쓸 수 있어
  파일 수와 요청이 더 줄어듭니다

### DX 개선

- `@font-face` 수동 작성 + preload 관리가 선언문 하나로 축소
- 제로 런타임: CSS는 빌드 때 생성, 클라이언트 JS 비용 0

## 흔한 오해와 주의점

1. **"`display: swap`이면 CLS가 자동으로 없다"** — swap은 텍스트를 빨리 보여주는
   선택일 뿐입니다. 레이아웃이 안 움직이는 이유는 따로 있는
   `adjustFontFallback`의 메트릭 보정(`size-adjust` 등) 덕분입니다.
   `adjustFontFallback: false`로 끄면 swap 환경에서도 CLS가 생길 수 있습니다.
2. **"외부 `<link>`와 next/font를 섞어 써도 비용이 같다"** — 외부 `<link>`는
   직렬 요청 체인(CSS → woff2)과 외부 의존성을 다시 들여옵니다. `/cdn` 페이지에서
   직접 비교할 수 있습니다.
3. **"여러 곳에서 `localFont()`을 여러 번 호출해도 한 번만 로드된다"** — 호출
   때마다 별도 폰트 인스턴스로 호스팅됩니다. 한 곳에서 선언해 재사용하세요.
4. **"preload는 항상 모든 페이지에서 된다"** — preload는 폰트를 호출한 파일의
   범위(페이지/레이아웃/루트 레이아웃)를 따릅니다. 특정 페이지에서만 호출한
   폰트는 다른 라우트에서 preload되지 않습니다.
5. **이 예시의 폰트 파일은 일부 글리프만 담은 작은 파일(약 4.5KB)입니다.**
   실제 한글 폰트는 weight당 MB 단위이므로, 전체 글리프를 다루는 서비스에서는
   서브셋·weight 선택이 용량에 훨씬 큰 영향을 줍니다.

## 관련 문서

- [Font Optimization — Getting Started](https://nextjs.org/docs/app/getting-started/fonts)
- [next/font API](https://nextjs.org/docs/app/api-reference/components/font)
- [Optimize CLS — 웹 폰트 항목 (web.dev)](https://web.dev/articles/optimize-cls)
