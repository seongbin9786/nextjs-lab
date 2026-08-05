# 16 — 다국어 라우팅 (i18n)

> 언어를 URL의 첫 세그먼트(/ko, /en)로 다루는 패턴. App Router에서는 직접 구성합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` → `Accept-Language` 헤더를 보고 `/ko` 또는 `/en`으로 리다이렉트
- `/ko`, `/en` → 각 언어 사전(dictionary)으로 렌더링
- `/ko/about`, `/en/about` → 모든 페이지가 locale 파라미터를 받음
- `/fr` → 지원 안 함 → 404

브라우저 언어 설정을 바꾸고 `/`에 접근하면 리다이렉트 대상이 달라지는 것을 확인할 수
있습니다(개발자 도구의 Network 탭에서 리다이렉트 응답 확인).

## 이 예시가 보여주는 것

| 개념 | 구현 방식 | 관련 파일 |
| --- | --- | --- |
| URL = 언어 | `[locale]` 동적 세그먼트 | `app/[locale]/` |
| 언어 감지 | 루트 페이지에서 `Accept-Language` 파싱 후 리다이렉트 | `app/page.tsx` |
| 미지원 언어 차단 | `isLocale()` 검증 + `notFound()` | `app/[locale]/layout.tsx` |
| 문구 관리 | 언어별 사전(dictionary) 객체 | `lib/i18n.ts` |
| 언어별 정적 생성 | `generateStaticParams`로 ko/en SSG | `app/[locale]/page.tsx` |
| `<html lang>` | 루트 레이아웃에서 설정 (정적 생성 시 한계는 동작 원리 4 참고) | `app/layout.tsx` |
| hreflang | `alternates.languages` 메타데이터 | `app/[locale]/layout.tsx` |
| 언어 전환 | 현재 경로의 locale 세그먼트만 교체 | `components/locale-switcher.tsx` |

## 동작 원리

### 1. App Router에는 내장 i18n 라우팅 설정이 없습니다

Pages Router 시절에는 `next.config.js`의 `i18n` 옵션(locales, defaultLocale)이 라우팅을
대신해 줬지만, App Router에는 그런 내장 설정이 없습니다. 그래서 공식 문서의 국제화
가이드는 **`[lang]` 동적 세그먼트로 직접 구성하는 패턴**을 처음부터 끝까지 보여줍니다.
핵심 문장은 이렇습니다.

> Ensure all special files inside `app/` are nested under `app/[lang]`. This enables
> the Next.js router to dynamically handle different locales in the route, and forward
> the `lang` parameter to every layout and page.

즉, 언어를 **URL의 일부**로 만들면 나머지는 동적 라우팅의 기존 규칙이 그대로 작동합니다.

- `/ko`, `/en`은 `[locale]` 세그먼트의 서로 다른 파라미터 값입니다.
- 라우터는 `locale` 파라미터를 **레이아웃과 페이지에 전달**합니다. 이 예시에서는
  `[locale]` 레이아웃과 각 페이지는 물론, 세그먼트 위쪽의 루트 레이아웃까지
  `params.locale`을 읽습니다(다만 정적 생성 시에는 예외가 있는데, 4번에서 빌드
  산출물과 함께 다룹니다).
- 언어마다 독립 URL이므로 언어별 정적 생성, 캐싱, hreflang이 전부 자연스러워집니다.

이 구조의 장점은 미들웨어(proxy) 같은 추가 계층이 **필수는 아니라는 것**입니다. 이
예시는 미들웨어 없이 루트 페이지만으로 완성합니다.

### 2. 루트에서의 언어 감지와 리다이렉트 흐름

공식 가이드는 언어 감지를 proxy(미들웨어)에서 하는 예시를 보여주지만, 이 예시는 더
단순한 방법을 씁니다. **루트 경로 `/`에 페이지를 두고 거기서 감지**합니다.

```tsx
// app/page.tsx
export default async function RootPage() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") ?? "";
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((code) => locales.includes(code as (typeof locales)[number]));

  redirect(`/${preferred && isLocale(preferred) ? preferred : defaultLocale}`);
}
```

흐름을 단계별로 보면 이렇습니다.

1. 브라우저는 요청에 `Accept-Language` 헤더를 실어 보냅니다. 예: `ko-KR,ko;q=0.9,en;q=0.8`.
   `;q=0.9` 같은 부분은 우선순위(quality value)입니다.
2. 코드는 헤더를 `,`로 나누고, 각 항목에서 `;` 앞의 언어 코드만 남깁니다.
   `["ko-KR", "ko", "en"]`
3. 앞 두 글자를 소문자로 만들어 `["ko", "ko", "en"]`로 정규화한 뒤, 지원하는 언어 목록
   (`lib/i18n.ts`의 `locales`)에 들어있는 **첫 번째 값**을 고릅니다.
4. `redirect()`로 `/ko`(또는 `/en`)로 보냅니다. 맞는 언어가 없으면 `defaultLocale`인
   `/ko`로 갑니다.

여기서 한 가지 렌더링 디테일이 생깁니다. `headers()`는 요청 시점 API라, 이 루트
페이지는 정적 파일이 아니라 **요청마다 실행**됩니다. 의도된 비대칭입니다 — 감지는
요청 헤더가 필요하니 동적으로, 콘텐츠 페이지(`/ko`, `/en`)는 정적으로 둡니다.

참고로 공식 가이드의 proxy 방식은 **모든 경로**에서 locale 없는 URL을 가로채
리다이렉트할 수 있습니다(예: `/about` → `/ko/about`). 이 예시는 루트(`/`)에서만
감지한다는 점이 다릅니다(아래 "흔한 오해와 주의점" 참고).

### 3. locale 검증과 사전(dictionary) 패턴

`[locale]` 아래 모든 페이지가 공유하는 레이아웃이 두 가지 책임을 집니다.

```tsx
// app/[locale]/layout.tsx
const { locale } = await params;
if (!isLocale(locale)) {
  notFound();      // 지원하지 않는 언어(/fr 등)는 404
}
const dict = getDictionary(locale);
```

- **검증**: `[locale]`은 어떤 문자열이든 받습니다. `/fr`처럼 지원하지 않는 값이 들어와도
  라우팅 자체는 매칭되므로, `isLocale()`로 걸러 `notFound()`를 던집니다. 이 검증이
  없으면 `/fr`이 기본 언어로 렌더링되어 이상한 URL이 색인될 수 있습니다.
- **사전**: `lib/i18n.ts`의 `dictionaries`는 언어별로 같은 구조의 문자열 객체를 담은
  상수입니다. `getDictionary(locale)`가 해당 언어 사전을 돌려줍니다.

사전 패턴의 요점은 공식 문서가 짚어준 대로 **서버 번들 문제에서 자유롭다**는 것입니다.

> Since all layouts and pages in the `app` directory default to Server Components, we
> do not need to worry about the size of the translation files affecting our client-side
> JavaScript bundle size. This code will only run on the server, and only the resulting
> HTML will be sent to the browser.

이 예시의 모든 페이지는 서버 컴포넌트라, 사전 객체는 서버에서 문자열을 골라 HTML만
보냅니다. 문구가 아무리 커져도 클라이언트 JS에는 영향이 없습니다.

### 4. locale이 `<html lang>`이 되기까지

SEO/접근성의 기본인 `<html lang>`은 **루트 레이아웃**이 설정합니다. 1번에서 본 대로
라우터는 `[locale]` 파라미터를 상위 레이아웃에도 전달하므로 이런 코드가 가능합니다.

```tsx
// app/layout.tsx
const { locale } = await params;
return (
  <html lang={locale && isLocale(locale) ? locale : "ko"}>
    <body>{children}</body>
  </html>
);
```

코드의 의도는 "`/en/about`이면 루트 레이아웃이 `params.locale = "en"`을 받아
`<html lang="en">`을 만든다"입니다. `/`(리다이렉트 페이지)처럼 locale 세그먼트가 없는
라우트에서는 `locale`이 없으므로 기본값 `"ko"`로 떨어집니다. `lang` 속성은 스크린리더의
발음 언어 선택과 검색엔진의 언어 판단에 사용됩니다.

**그런데 이 예시의 빌드 산출물을 확인하면 뜻밖의 사실이 보입니다.** 정적으로 생성된
`.next/server/app/en.html`을 열어보면 본문은 영어 사전으로 잘 렌더링되어 있는데(즉
`[locale]` 레이아웃과 페이지는 `locale = "en"`을 정상적으로 받았습니다), 맨 위의
태그는 `<html lang="ko">`입니다. `/en`인데 `lang`이 한국어로 고정된 것입니다.

원인은 루트 레이아웃의 위치에 있습니다. 이 예시의 루트 레이아웃은 `[locale]` 세그먼트
**바깥(위)** 에 있습니다. 정적 생성에서는 이렇게 세그먼트 위쪽에 있는 레이아웃이 언어별로
따로 렌더링되지 않고 정적 껍데기(shell)로 공유됩니다. 그래서 `/ko`를 렌더링할 때 만들어진
`lang="ko"` 껍데기가 `/en`에도 그대로 재사용됩니다. 요청 시 렌더링되는 경로(예:
`/en/about`)는 매 요청 트리 전체가 새로 렌더링되므로 루트 레이아웃의 locale 분기가
그대로 동작하는 구조지만, 정적으로 생성된 경로에서는 `lang`이 고정됩니다.

이 함정 때문에 공식 i18n 가이드는 **루트 레이아웃 자체를 `[lang]` 폴더 안에 두는**
구성("The root layout can also be nested in the new folder")을 함께 소개합니다. 그렇게
하면 `<html lang>`이 각 언어 라우트 트리의 일부가 되어 언어별 정적 생성에서도 lang이
올바르게 나뉩니다. 이 예시는 "루트 레이아웃이 세그먼트 바깥에서 `params`를 읽는" 구조와
그 한계를 함께 보여주는 셈입니다. 실서비스처럼 언어별 `lang`이 중요하다면 루트
레이아웃을 `[locale]` 안으로 옮기는 것을 권합니다.

### 5. 언어별 정적 생성

```tsx
// app/[locale]/page.tsx
export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}
```

`generateStaticParams`가 나열한 파라미터 조합만큼 빌드 시점에 페이지가 생성됩니다.
실제 빌드 산출물(`.next/server/app/`)에 `ko.html`, `en.html` 두 파일이 생성되는 것을
직접 확인할 수 있습니다. 목록에 없는 locale(예: `fr`)로 요청이 오면 레이아웃의
`notFound()`가 404로 막습니다.

참고로 `about` 페이지는 자체 `generateStaticParams`가 없어 빌드 때 HTML이 생성되지
않고(빌드 출력에 about의 `.html` 파일이 없습니다) 요청 시 렌더링됩니다. about도 빌드
시점에 함께 만들어 두려면 같은 목록의 `generateStaticParams`를 about 페이지에도
추가하면 됩니다.

### 6. hreflang alternates: 검색엔진에 언어를 알리는 원리

같은 콘텐츠의 언어별 URL이 따로 있으면, 검색엔진에게 "이 페이지의 다른 언어 버전은
여기 있다"고 명시해야 합니다. 이 예시는 `[locale]` 레이아웃의 메타데이터로 선언합니다.

```tsx
// app/[locale]/layout.tsx
const languages: Record<string, string> = {};
for (const l of locales) {
  languages[l] = `/example-base/${l}`;
}
return { alternates: { languages } };
```

`alternates.languages`는 `<head>`에 hreflang 링크 태그로 변환됩니다. Metadata API 문서의
출력 예시는 이렇습니다.

```html
<link rel="alternate" hreflang="en-US" href="https://acme.com/en-US" />
<link rel="alternate" hreflang="de-DE" href="https://acme.com/de-DE" />
```

이 예시를 빌드한 뒤 `ko.html`을 확인하면 실제로는 이렇게 들어가 있습니다.

```html
<link rel="alternate" hrefLang="ko" href="/example-base/ko" />
<link rel="alternate" hrefLang="en" href="/example-base/en" />
```

이 태그를 본 검색엔진은 각 언어 버전이 별도의 페이지임을 알고, 사용자의 언어에 맞는
버전을 검색 결과로 보여줄 수 있습니다. 레이아웃에 선언했으므로 그 아래 모든 페이지에
적용됩니다. 사이트맵에도 같은 정보를 실을 수 있는데(`alternates.languages` 필드가 있는
사이트맵 항목은 `xhtml:link rel="alternate" hreflang` 요소로 출력됩니다), 이 부분은
13-metadata-seo 예시의 사이트맵 문서를 참고하세요.

## 코드와 함께 보는 설명

### 파일 구조

```
app/
  page.tsx                  # / : 언어 감지 후 리다이렉트
  layout.tsx                # <html lang> 설정 (정적 생성 시 주의 — 동작 원리 4)
  [locale]/
    layout.tsx              # locale 검증 + 공통 내비게이션
    page.tsx                # 홈 (generateStaticParams로 ko/en SSG)
    about/page.tsx
lib/i18n.ts                 # locale 목록 + 사전
components/locale-switcher.tsx
```

### `lib/i18n.ts` — 언어의 단일 진실 공급원

```ts
export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
```

`locales` 배열이 이 앱이 지원하는 언어의 전부입니다. `as const` 덕분에 `Locale` 타입은
`"ko" | "en"` 리터럴 타입이 되고, `isLocale()`은 타입 가드(`value is Locale`)로
동작합니다. 지원 언어를 추가하면 이 배열과 `dictionaries`에만 추가하면 됩니다.
`getDictionary()`는 모르는 locale이 들어와도 기본 언어 사전을 반환하도록 방어적으로
작성되어 있습니다 — 그래서 레이아웃의 `notFound()` 검증이 더 중요합니다.

### `app/page.tsx` — 감지와 리다이렉트

위 "동작 원리 2"의 코드 그대로입니다. 화면을 렌더링하지 않고 곧바로 `redirect()`합니다.

### `app/[locale]/layout.tsx` — 검증 + 공통 UI + hreflang

검증과 사전 로딩(동작 원리 3), 사전에서 문구를 꺼내 만든 내비게이션, `LocaleSwitcher`,
그리고 `generateMetadata`로 선언한 hreflang(동작 원리 6)이 한 파일에 있습니다.
내비게이션 링크는 전부 `/${locale}`로 시작해 현재 언어 안에 머무릅니다.

### `app/[locale]/page.tsx`, `app/[locale]/about/page.tsx` — 사전으로 렌더링

두 페이지의 모양은 같습니다. `params`에서 locale을 꺼내 검증하고, 사전의 문구로
JSX를 채웁니다. `page.tsx`에는 `generateStaticParams`가 있어 ko/en 두 버전이 빌드 시
생성됩니다. `about` 페이지는 정적 파라미터 목록이 없어 빌드 때 생성되지 않고 요청 시
렌더링됩니다.

### `components/locale-switcher.tsx` — 세그먼트 교체

```tsx
// components/locale-switcher.tsx
const pathname = usePathname();
const rest = pathname.replace(/^\/[^/]+/, "") || "";
// ...
<Link key={locale} href={`/${locale}${rest}`}>
```

클라이언트 컴포넌트(`usePathname`이 필요)이며, 현재 경로에서 첫 세그먼트(locale)만
잘라내고 다른 언어를 붙입니다. `/ko/about`에서 EN을 누르면 `/en/about`으로 갑니다.
같은 콘텐츠의 다른 언어 버전으로 연결되므로, 검색엔진이 hreflang과 함께 언어 쌍을
이해하는 데에도 좋은 신호입니다.

## 좋은 활용 사례

- 사전은 `lib/i18n.ts` → 규모가 커지면 JSON 파일/CMS로
- 날짜/숫자는 `Intl.NumberFormat(locale)`로 포맷
- 언어 전환기는 현재 경로의 locale 세그먼트만 교체
- 루트에서 `Accept-Language`로 초기 언어 추천
- 사전이 커지면 언어별 파일로 나눠 동적 import로 lazy 로딩 (공식 가이드의
  `dictionaries/en.json` 패턴). `import 'server-only'`를 붙여 실수로 클라이언트 번들에
  들어가는 것을 막을 수 있습니다
- 선택한 언어를 쿠키에 저장해 두면 다음 방문 때 `/` 리다이렉트에 활용할 수 있습니다
- 트래픽이 많은 공개 사이트라면 감지 로직을 proxy(미들웨어)로 올려 locale 없는 모든
  경로를 리다이렉트하는 것을 고려하세요

### 정량 비교: URL 기반 vs 쿠키 기반 언어

| 방식 | SEO | 공유/재현 |
| --- | --- | --- |
| URL 세그먼트 (`/ko/...`) | 언어별 인덱싱, hreflang 가능 | 같은 URL = 같은 언어 |
| 쿠키/헤더만으로 전환 | 검색엔진이 언어를 구분 못 함 | URL로 언어 특정 불가 |

콘텐츠가 공개 대상이라면 **URL 기반이 표준**입니다.

### DX 개선

- 프레임워크 내장 라우팅 규칙(`[locale]`)으로 미들웨어 없이 구성
- 언어가 라우트 파라미터라 타입과 빌드 검증이 자동

## 흔한 오해와 주의점

1. **"모든 경로가 자동으로 언어 리다이렉트되겠지" — 이 예시는 루트(`/`)만.** locale
   없는 경로(`/about`)는 매칭되는 라우트가 없어 404가 됩니다. 모든 경로를 리다이렉트하려면
   공식 가이드처럼 proxy(미들웨어)에서 "경로 앞에 locale이 없으면 감지 후 리다이렉트"
   규칙을 적용해야 합니다.
2. **"`<html lang>`은 항상 언어에 맞춰지겠지" — 정적으로 생성된 페이지는 예외입니다.**
   이 예시의 빌드에서 `/en` 페이지는 본문이 영어인데도 `<html lang="ko">`로 서빙됩니다.
   루트 레이아웃이 `[locale]` 세그먼트 바깥에 있어, 정적 생성 시 레이아웃 껍데기가
   공유되기 때문입니다(동작 원리 4 참고). 언어별 `lang`이 중요하다면 루트 레이아웃을
   `[locale]` 폴더 안으로 옮기세요.
3. **"hreflang 경로는 이대로 배포해도 되지" — 아님.** 이 예시의 `alternates`는
   `/example-base/${l}`라는 예시용 경로입니다. 실제 도메인으로 바꿔야 합니다. 또한
   레이아웃 하나에서 모든 페이지에 같은 alternates가 붙으므로, 페이지가 많아지면
   **페이지별 경로**를 가리키도록(각 언어 버전의 전체 URL) 각 페이지에서 선언하는 것이
   올바릅니다.
4. **"`getDictionary`가 폴백을 주니 검증은 생략해도 되지" — 반대입니다.** 폴백 덕분에
   에러는 안 나지만, `/fr` URL이 한국어 콘텐츠로 렌더링되어 검색엔진에 엉뚱한 언어
   페이지가 생깁니다. 검증 + `notFound()`가 먼저입니다.
5. **"사전을 클라이언트 컴포넌트에서 바로 import하면 되지" — 이 구조에서는 사전이 서버
   렌더링에 맞춰져 있습니다.** 이 예시의 컴포넌트 중 유일한 클라이언트 컴포넌트
   (`LocaleSwitcher`)는 사전을 쓰지 않습니다. 클라이언트 컴포넌트에 문구가 필요하면
   서버 컴포넌트에서 props로 넘기세요.
6. **"언어를 추가하려면 라우팅 코드도 고쳐야 하나" — 아닙니다.** `lib/i18n.ts`의
   `locales` 배열과 사전에 항목을 추가하고, 정적 생성을 원하면 `generateStaticParams`
   목록에 `[{ locale: "fr" }]`를 추가하면 됩니다. 라우팅 구조(`[locale]`)는 그대로
   재사용됩니다.

## 관련 문서

- [Internationalization](https://nextjs.org/docs/app/guides/internationalization)
- [generateMetadata (alternates/hreflang)](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Minimal i18n routing and translations (공식 예시)](https://github.com/vercel/next.js/tree/canary/examples/i18n-routing)
- [next/root-params (루트 파라미터 읽기)](https://nextjs.org/docs/app/api-reference/functions/next-root-params)
- [sitemap.xml (다국어 사이트맵)](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [next-intl](https://next-intl.dev)
