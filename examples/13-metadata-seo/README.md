# 13 — Metadata와 SEO

> 코드에서 메타태그를 관리합니다. `metadata` export + 파일 규칙으로 sitemap/robots/OG 이미지를 생성합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

확인할 주소:

- `/` — 홈. 루트 메타데이터가 그대로 적용된 페이지
- `/products/keyboard`, `/products/mouse` — `generateMetadata`로 만드는 상품별 메타
- `/products/keyboard/opengraph-image` — 코드로 생성된 OG 이미지(PNG)
- `/jsonld` — JSON-LD 구조화 데이터
- `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest` — 파일 규칙이 만든 엔드포인트

## 이 예시가 보여주는 것

| 산출물 | 만든 것 | 확인 |
| --- | --- | --- |
| `metadata` export | 루트 기본값 + title 템플릿 | 페이지 소스 보기 |
| `generateMetadata` | 상품별 title/description | `/products/keyboard` 소스 |
| `opengraph-image.tsx` | 상품 OG 이미지를 코드로 렌더링 | `/products/keyboard/opengraph-image` |
| `sitemap.ts` | 사이트맵 | `/sitemap.xml` |
| `robots.ts` | robots.txt | `/robots.txt` |
| `manifest.ts` | PWA 매니페스트 | `/manifest.webmanifest` |
| `icon.svg` | 파비콘 | 브라우저 탭 |
| JSON-LD | 구조화 데이터 | `/jsonld` 소스 |

## 동작 원리

### 1. 메타데이터는 "선언"이고, 최종 `<head>`는 병합의 결과입니다

Metadata API는 HTML `<head>`를 문자열로 조립하는 대신, **타입이 있는 객체를 선언**하는
방식입니다. 선언하는 방법은 두 가지입니다.

- **정적**: `layout.tsx` / `page.tsx`에서 `export const metadata: Metadata = {...}`
- **동적**: 같은 파일에서 `export async function generateMetadata({ params, searchParams }, parent)` —
  라우트 파라미터, 외부 데이터, 부모 세그먼트의 메타데이터처럼 **요청 시점에야 아는 값**으로
  메타를 만들 때 사용합니다. 두 번째 인자 `parent`는 부모 세그먼트에서 이미 해석된
  메타데이터의 Promise라, 교체 대신 확장이 필요할 때 쓸 수 있습니다.

핵심은 이 선언들이 각각 따로 존재하다가, 렌더링 시점에 **하나의 `<head>`로 병합**된다는
점입니다. 공식 문서의 규칙은 이렇습니다.

> Metadata is evaluated in order, starting from the root segment down to the segment
> closest to the final `page.js` segment.

즉 평가 순서는 루트 레이아웃에서 시작해 페이지에 가장 가까운 세그먼트로 내려갑니다.

> Metadata objects exported from multiple segments in the same route are **shallowly**
> merged together... Duplicate keys are **replaced** based on their ordering.

정리하면:

1. 루트 → 중간 레이아웃 → 페이지 순서로 평가합니다.
2. 결과는 **얕은 병합(shallow merge)** 입니다. 중복 키는 나중(더 깊은 세그먼트) 값으로 **교체**됩니다.
3. 그래서 `openGraph`, `robots`처럼 중첩된 객체는, 더 깊은 세그먼트가 해당 키를 다시
   정의하는 순간 **통째로 교체**됩니다. 재정의하지 않으면 그대로 **상속**됩니다.

이 예시로 직접 따라가 보겠습니다. 루트 레이아웃과 상품 페이지가 각각 선언하는 값은
이렇습니다.

```tsx
// app/layout.tsx (루트)
export const metadata: Metadata = {
  metadataBase: new URL("https://nextjs-lab.example.com"),
  title: { template: "%s | nextjs-lab 상점", default: "nextjs-lab 상점 | Metadata와 SEO" },
  description: "Next.js Metadata API로 SEO 메타태그를 관리하는 예시 상점입니다.",
  openGraph: { siteName: "nextjs-lab 상점", locale: "ko_KR", type: "website" },
  robots: { index: true, follow: true },
};
```

```tsx
// app/products/[id]/page.tsx
return {
  title: product.name,
  description: product.description,
  openGraph: { title: product.name, description: product.description, type: "website" },
};
```

`/products/keyboard`의 최종 `<head>`는 이렇게 해석됩니다. 이 표는 추정이 아니라, 이
예시를 빌드한 결과물(`keyboard.html`)의 `<head>`를 직접 확인한 것입니다.

| 필드 | 최종 값 | 이유 |
| --- | --- | --- |
| `title` | `기계식 키보드 K1 | nextjs-lab 상점` | 페이지의 문자열 title에 루트의 `template`이 적용 |
| `description` | 상품 설명 | 페이지가 루트 값을 교체 |
| `openGraph` | 페이지가 선언한 필드만 | 페이지가 `openGraph`를 재정의해 루트 객체가 통째로 교체 |
| `robots` | 루트 값 유지 (`index, follow`) | 페이지가 재정의하지 않아 상속 |
| `og:image` | `…/products/keyboard/opengraph-image?0993…` | `images`를 생략하면 같은 폴더 파일 규칙이 자동 연결 (콘텐츠 해시가 붙은 완전 URL) |

실제 HTML에는 `og:image:type`(`image/png`), `og:image:width`(1200), `og:image:height`(630),
`og:image:alt`가 `opengraph-image.tsx`의 export에서 생성되어 함께 들어가고, OG 값은
`twitter:title`/`twitter:description`로도 복사됩니다. `metadataBase` 덕분에 `og:image`는
상대 경로가 아니라 완전한 URL로 해석됩니다. 반대로 루트 메타만 적용된 홈(`index.html`)에는
`og:site_name`, `og:locale`이 있습니다 — 상품 페이지에서는 `openGraph`가 재정의되면서
두 태그가 사라졌다는 뜻입니다.

`title.template`에는 문서가 명시하는 세부 규칙이 있습니다.

- 템플릿은 **자식 세그먼트**의 title에만 적용됩니다. 같은 세그먼트의 `page.tsx` title에는
  같은 폴더 `layout.tsx`의 템플릿이 적용되지 않습니다.
- 템플릿을 쓰려면 `default`가 반드시 필요합니다.
- `title.absolute`은 부모 템플릿을 무시하고 절대 제목을 강제합니다.

`metadataBase`는 URL 기반 필드의 기준 주소입니다. 이 값이 있으면 그 세그먼트와 하위에서
`og:image` 같은 필드에 상대 경로를 쓸 수 있고, 기준 주소와 합쳐져 완전한 URL이 됩니다.
완전 URL을 직접 주면 `metadataBase`는 무시되며, `metadataBase` 없이 상대 경로만 쓰면
빌드 에러가 납니다. OG 이미지/SNS 카드가 제대로 동작하려면 사실상 필수 설정입니다.

### 2. 파일 규칙은 "특별한 라우트 핸들러"로 변환됩니다

`app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`는 페이지가 아니라 **엔드포인트를
만드는 파일 규칙**입니다. Next.js가 이 파일들을 특별한 라우트 핸들러로 변환해 아래
URL에 마운트합니다.

| 파일 | 엔드포인트 | 반환 형태 |
| --- | --- | --- |
| `app/sitemap.ts` | `GET /sitemap.xml` | 사이트맵 XML |
| `app/robots.ts` | `GET /robots.txt` | Robots Exclusion 표준 텍스트 |
| `app/manifest.ts` | `GET /manifest.webmanifest` | 웹 매니페스트 JSON |
| `app/icon.svg` | `/icon.svg` | 정적 아이콘 파일 |
| `app/products/[id]/opengraph-image.tsx` | `GET /products/[id]/opengraph-image` | PNG 이미지 |

공통된 동작 원리는 이 문서 한 줄에 담겨 있습니다.

> `sitemap.js` is a special Route Handler that is cached by default unless it uses a
> Request-time API or dynamic config option.

즉, 요청 시점 API(`headers()`, `cookies()`, 동적 fetch 등)를 쓰지 않는 한 **빌드 시점에
한 번 생성되어 캐시**됩니다. 이 예시의 sitemap/robots/manifest는 전부 정적 데이터를
읽으므로 빌드 때 만들어집니다. 반대로 요청 시점 API를 사용하면 각 요청마다 재생성됩니다.
`robots.ts`/`sitemap.ts`는 정적 `robots.txt`/`sitemap.xml` 파일을 두는 것도 가능하지만,
코드 버전은 데이터(상품 목록)에서 URL을 만들어 **항상 최신 상태**로 유지된다는 장점이
있습니다.

그래서 빌드 출력에 메타데이터 라우트가 전부 보입니다:

```
├ ○ /icon.svg
├ ○ /manifest.webmanifest
├ ○ /robots.txt
└ ○ /sitemap.xml
```

### 3. `opengraph-image.tsx`: JSX가 PNG가 되는 과정

`opengraph-image` 파일 규칙은 두 가지 형태를 지원합니다.

- **이미지 파일** (`opengraph-image.jpg|jpeg|png|gif`): 두기만 하면 Next.js가 평가해서
  `og:image` 태그를 자동 생성합니다. 옆에 `opengraph-image.alt.txt`를 두면 `og:image:alt`도
  채워집니다.
- **코드** (`opengraph-image.tsx`): default export 함수가 `Response`를 반환하는 이미지
  생성 라우트가 됩니다.

코드 방식의 핵심은 `next/og`의 `ImageResponse`입니다. JSX 요소와 크기 옵션을 받으면
이미지(PNG 등) 응답을 만들어 줍니다. 이 예시의 파일을 보면 필요한 export가 모두 있습니다.

```tsx
// app/products/[id]/opengraph-image.tsx
export const alt = "상품 OG 이미지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  return new ImageResponse((<div style={{ /* flexbox 레이아웃 */ }}>...</div>), size);
}
```

이 export들이 하는 일은 다음과 같습니다.

- `alt`, `size`, `contentType`은 각각 `og:image:alt`, `og:image:width`/`height`,
  `og:image:type` 태그로 변환됩니다.
- default export는 `params`(동적 세그먼트 파라미터 Promise)를 받아, 상품 데이터로 JSX를
  그리고 `ImageResponse`로 반환합니다.

생성 시점도 중요합니다. 공식 문서는 이렇게 설명합니다.

> By default, generated images are statically optimized (generated at build time and
> cached) unless they use Request-time APIs or uncached data.

동적 파라미터에 의존하지 않는 이미지 라우트라면 빌드 때 미리 만들어 둔다는 뜻입니다.
그런데 이 예시의 빌드 산출물을 직접 확인하면 재미있는 차이가 보입니다. `sitemap.xml`,
`robots.txt`, `manifest.webmanifest`는 빌드 때 본문(`.body` 파일)까지 미리 생성되어
있지만, OG 이미지 라우트는 `[id]` 동적 세그먼트 안에 있어 빌드 출력에는 라우트
핸들러(`/products/[id]/opengraph-image/route`)만 등록되어 있습니다. **PNG는 첫 요청 시
생성된 뒤 캐시**됩니다(특별한 라우트 핸들러는 기본적으로 캐시되므로 같은 이미지는
계속 재사용됩니다). 즉 상품 페이지 HTML은 정적이지만, OG 이미지는 지연 생성되는
구조입니다.

그리고 `generateMetadata`에서 `openGraph.images`를 생략하면, 같은 폴더의
`opengraph-image.tsx`가 자동으로 `og:image`의 재료가 됩니다. 이미지 파일을 수동으로
만들지 않고, 상품 데이터에서 **빌드/요청 시 생성**하는 구조입니다.

참고로 파일 크기 제한이 있습니다. `twitter-image`는 5MB, `opengraph-image`는 8MB를
넘기면 빌드가 실패합니다.

### 4. JSON-LD는 왜 `application/ld+json`인가

JSON-LD는 검색엔진과 AI가 페이지의 **의미 구조**를 읽게 하는 직렬화 형식입니다.
핵심은 "데이터이지 실행 코드가 아니다"라는 점입니다.

`<script type="application/ld+json">`으로 넣는 이유는 다음과 같습니다.

- `type`이 `text/javascript`가 아니므로 **브라우저가 이 내용을 실행하지 않습니다**.
  렌더링 비용 없이 HTML 안에 데이터만 실립니다.
- `application/ld+json`은 JSON-LD 규격이 정의한 미디어 타입입니다. 크롤러는 이 타입의
  스크립트 블록을 찾아 파싱합니다. (존재하지 않는 `application/ld+google` 같은 타입을
  쓰면 어떤 도구도 인식하지 못합니다.)
- Next.js 공식 가이드도 이 방식을 권장합니다.

> Our current recommendation for JSON-LD is to render structured data as a `<script>`
> tag in your `layout.js` or `page.js` components.

또 하나, 공식 문서의 주의사항입니다.

> Since JSON-LD is structured data, not executable code, a native `<script>` tag is
> the right choice here.

즉, JS 로딩을 최적화하는 `next/script`가 아니라 **그냥 `<script>` 태그**가 정답입니다.
서버 컴포넌트에서 렌더링되므로 HTML에 그대로 직렬화되어, JS가 비활성화된 크롤러도
읽을 수 있습니다.

주의할 점은 `JSON.stringify`가 악의적인 문자열을 소독하지 않는다는 것입니다. 문서에서는
`<` 문자를 `\u003c`로 치환하거나(예: `JSON.stringify(jsonLd).replace(/</g, '\\u003c')`),
`serialize-javascript` 같은 대안을 검토하라고 권합니다. 이 예시의 `/jsonld` 페이지는
데이터가 전부 하드코딩된 상수라 그대로 `JSON.stringify`를 사용합니다.

## 코드와 함께 보는 설명

### `app/layout.tsx` — 메타데이터의 기본값

루트 레이아웃의 `metadata` export가 앱 전체의 기본값 역할입니다. `metadataBase`(OG
절대 URL의 기준), `title.template`(`%s | nextjs-lab 상점`)과 `default`, 공통
`description`, `openGraph` 기본값(`siteName`, `locale`, `robots`)이 여기서 선언됩니다.
하위 페이지가 아무 메타도 선언하지 않으면 이 값들이 최종 `<head>`가 됩니다.

### `lib/products.ts` — 데이터 원천

```ts
export const products: Product[] = [
  { id: "keyboard", name: "기계식 키보드 K1", price: 89000, /* ... */ },
  { id: "mouse", name: "무선 마우스 M2", price: 45000, /* ... */ },
];
```

상품 목록은 `generateMetadata`, `opengraph-image.tsx`, `sitemap.ts`, `/jsonld` 페이지가
공유합니다. **데이터와 메타가 같은 서버 코드에서 나오기 때문에 어긋날 수가 없습니다.**
이것이 이 예시가 반복해서 보여주는 포인트입니다.

### `app/products/[id]/page.tsx` — 동적 메타데이터

```tsx
export function generateStaticParams() {
  return [{ id: "keyboard" }, { id: "mouse" }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "상품 없음" };
  return { title: product.name, description: product.description, openGraph: { /* ... */ } };
}
```

`generateStaticParams`가 두 상품을 나열하므로 페이지 HTML은 빌드 시 생성됩니다(OG
이미지는 위 "동작 원리 3"에서 본 대로 첫 요청 시 생성됩니다). `params`는 Next.js 15+의
규칙대로 Promise라 `await` 후에 씁니다. 존재하지 않는 id에는 본문이 `notFound()`로
404를, 메타는 `{ title: "상품 없음" }`을 반환합니다.

### `app/products/[id]/opengraph-image.tsx` — 코드 OG 이미지

위 "동작 원리 3"에서 설명한 파일입니다. 남색 그라데이션 배경 위에 상점 이름, 상품 이름,
가격을 그립니다. `/products/keyboard/opengraph-image`로 직접 접근해 PNG를 눈으로 확인할
수 있습니다.

### `app/sitemap.ts` — 데이터에서 사이트맵 생성

```ts
// app/sitemap.ts
const productRoutes = products.map((p) => ({
  url: `${base}/products/${p.id}`,
  lastModified: new Date(),
  changeFrequency: "daily" as const,
  priority: 0.8,
}));
return [...staticRoutes, ...productRoutes];
```

반환 타입은 `MetadataRoute.Sitemap`(항목당 `url`, `lastModified`, `changeFrequency`,
`priority`, 선택적으로 `alternates`)입니다. 상품이 늘면 사이트맵도 자동으로 늘어납니다.
규모가 커지면 `generateSitemaps()`로 여러 사이트맵 파일(`/.../sitemap/[id].xml`)로 나눌
수도 있습니다(구글의 사이트맵 1개당 URL 한도는 50,000개). 다국어 사이트라면 각 항목에
`alternates.languages`를 넣어 hreflang이 포함된 사이트맵을 만들 수도 있습니다.

### `app/robots.ts` — 크롤러 규칙

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin/", "/private/"] }],
    sitemap: "https://nextjs-lab.example.com/sitemap.xml",
  };
}
```

`rules`는 배열로 여러 사용자 에이전트별 규칙을 줄 수 있고, `sitemap` 필드가
`Sitemap:` 지시어로 출력됩니다. `/robots.txt`로 서빙됩니다.

### `app/manifest.ts` — PWA 매니페스트

`name`, `short_name`, `start_url`, `display: "standalone"`, `theme_color`, `icons`
등을 반환하면 `/manifest.webmanifest`로 서빙되고, Next.js가 `<link rel="manifest">`로
연결합니다. 이 예시는 아이콘으로 `app/icon.svg`를 재사용합니다.

### `app/jsonld/page.tsx` — 구조화 데이터

`ItemList` 안에 두 상품을 `Product` + `Offer`(가격, 통화 KRW, 재고)로 표현합니다.

```tsx
// app/jsonld/page.tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(productList) }}
/>
```

`/jsonld`에서 페이지 소스를 보면 이 스크립트 블록이 서버 HTML에 그대로 들어 있습니다.
검색 결과의 리치 스니펫(가격, 재고 등) 노출과 AI 검색 도구의 정확한 인용에 도움을
줍니다. 검증은 Google Rich Results Test나 Schema Markup Validator로 할 수 있습니다.

## 좋은 활용 사례

- `metadataBase`는 반드시 설정 (OG 이미지 절대 URL 생성에 필요)
- title 템플릿을 루트에, 개별 title은 페이지에서
- 상품/글마다 `generateMetadata` + 폴더별 `opengraph-image.tsx`
- 가격/평점이 있는 콘텐츠는 JSON-LD(`Product`, `Article`) 추가
- OG 이미지는 SNS 카드 권장 규격인 1200x630으로 시작 (이 예시와 동일)
- 여러 페이지가 공유하는 OG 필드는 `shared-metadata` 모듈로 뽑아 스프레드로 합치면,
  얕은 병합으로 값이 사라지는 것을 막을 수 있습니다

### 정량 비교: 수동 메타태그 vs Metadata API

| 항목 | 수동 HTML 메타태그 | Metadata API |
| --- | --- | --- |
| 동적 페이지(상품 1만 개) | 별도 템플릿 시스템 필요 | **함수 하나로 자동** |
| 데이터-메타 불일치 | 가능 (따로 관리) | 같은 서버 코드에서 나와 불가능 |
| 사이트맵 갱신 | 수동 | 데이터에서 생성 |

### DX 개선

- `<head>` 수동 관리가 타입이 있는 객체로 대체 (TypeScript 검증)
- OG 이미지/sitemap/robots가 파일 규칙이라 라우팅과 같은 방식으로 관리

## 흔한 오해와 주의점

1. **"`openGraph`는 깊게 병합되겠지" — 아닙니다.** 병합은 얕습니다. 이 예시의 상품
   페이지처럼 하위 세그먼트에서 `openGraph`를 재정의하면, 루트의 `siteName`/`locale`은
   사라지고 페이지가 준 필드만 남습니다. (빌드된 `keyboard.html`을 확인하면 루트에는
   있던 `og:site_name`, `og:locale` 태그가 실제로 빠져 있습니다.) 함께 쓰고 싶은 필드는
   스프레드로 명시적으로 합치세요.
2. **"`images`를 직접 주면서 파일 규칙도 쓰면 둘 다 나오겠지" — 아님.**
   `openGraph.images`를 명시적으로 설정하면 같은 폴더의 `opengraph-image.tsx`는
   사용되지 않습니다. 둘 중 하나만 선택하세요.
3. **"title 템플릿은 같은 폴더 page에도 적용되겠지" — 아님.** `layout.tsx`의
   `title.template`은 자식 세그먼트에만 적용됩니다. 같은 세그먼트 `page.tsx`의 title은
   템플릿 없이 그대로 나옵니다. `page.tsx`에 쓴 템플릿은 자식이 없어 아무 효과가 없습니다.
4. **"JSON-LD에 `JSON.stringify`면 충분하다" — 데이터가 사용자 입력을 포함하면 위험.**
   `JSON.stringify`는 XSS 목적의 문자열을 소독하지 않습니다. `<`를 `\u003c`로 치환하는
   식의 처리가 필요합니다.
5. **"sitemap/robots는 요청할 때마다 새로 만들어지겠지" — 기본은 캐시.** 이 파일들은
   특별한 라우트 핸들러라 기본적으로 캐시됩니다. DB에서 실시간으로 읽는 사이트맵이
   필요하면 요청 시점 API/동적 설정을 사용해 의도적으로 동적으로 만들어야 합니다.

## 관련 문서

- [Metadata and OG Images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [JSON-LD](https://nextjs.org/docs/app/guides/json-ld)
- [generateMetadata API Reference](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Metadata Files (파일 규칙 총정리)](https://nextjs.org/docs/app/api-reference/file-conventions/metadata)
- [opengraph-image and twitter-image](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [ImageResponse](https://nextjs.org/docs/app/api-reference/functions/image-response)
- [sitemap.xml](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [manifest](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)
