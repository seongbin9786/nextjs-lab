# 02 — 동적 라우팅

> `[폴더]`로 URL 파라미터를 만들고, `generateStaticParams`로 빌드 시점에 미리 렌더링합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- 홈(`/`)에서 4가지 패턴의 링크를 전부 제공합니다.
- `/products/not-exist`로 `notFound()`가 만드는 404를 확인합니다.
- `pnpm build`를 실행하면 `/blog/*`(SSG)와 `/products/[id]`(Dynamic)의 빌드 출력
  차이가 표시됩니다.

## 이 예시가 보여주는 것

| 개념 | 파일 규칙 | 데모 위치 |
| --- | --- | --- |
| 동적 세그먼트 | `app/products/[id]/page.tsx` | `/products/keyboard` |
| 빌드 시 생성 (SSG) | `generateStaticParams` | `/blog/what-is-ssg` 포함 글 3개 |
| 캐치올 세그먼트 | `app/docs/[...path]/page.tsx` | `/docs/guides/routing/dynamic` |
| 선택적 캐치올 세그먼트 | `app/files/[[...path]]/page.tsx` | `/files` (파라미터 없음) |
| 선언적 404 | `notFound()` + `not-found.tsx` | `/products/not-exist` |

## 동작 원리

### 1. 빌드 시: 대괄호 폴더는 자리표입니다

URL 경로는 세그먼트의 나열이고, 각 세그먼트는 **정적**(정확한 값만 매칭)이거나
**동적**(URL에서 값을 잡아채는 자리표)입니다. 폴더 이름을 대괄호로 감싸면 동적
세그먼트가 됩니다. 세 가지 형태가 있습니다.

| 형태 | 폴더 이름 | 매칭 범위 | `params` 값의 타입 |
| --- | --- | --- | --- |
| 기본 | `[id]` | 세그먼트 정확히 하나 | `string` |
| 캐치올 | `[...path]` | 남은 모든 깊이 | `string[]` |
| 선택적 캐치올 | `[[...path]]` | 남은 모든 깊이 + 파라미터 없는 경로 | `string[]` 또는 `undefined` |

이 예시의 파일과 매칭 결과입니다.

```text
app/products/[id]/page.tsx       /products/keyboard      → { id: "keyboard" }
app/blog/[slug]/page.tsx         /blog/what-is-ssg       → { slug: "what-is-ssg" }
app/docs/[...path]/page.tsx      /docs/a/b/c             → { path: ["a", "b", "c"] }
app/files/[[...path]]/page.tsx   /files                  → { path: undefined }
```

`[...path]`와 `[[...path]]`의 차이는 하나입니다. 캐치올은 파라미터가 반드시 있어야
해서 `/docs` 자체는 매칭되지 않고(404), 선택적 캐치올은 파라미터 없는 `/files`까지
매칭합니다.

`params` 값의 타입이 `string`, `string[]`처럼 널찍한 이유는 사용자가 주소창에 아무
값이나 입력할 수 있기 때문입니다. 런타임이 되기 전에는 어떤 값이 들어올지 알 수
없으므로, 앱 코드가 모든 경우를 다루도록 타입이 넓게 잡혀 있습니다.

### 2. 갈림길: generateStaticParams 유무가 빌드 운명을 정합니다

**Case A — `/blog/[slug]` (generateStaticParams 있음)**

1. `next build`가 대응하는 레이아웃·페이지를 생성하기 **전에**
   `generateStaticParams`를 실행합니다.
2. 반환값 `[{ slug: "what-is-ssg" }, ...]`의 각 항목마다 페이지를 한 번씩
   렌더링해 HTML로 저장합니다 (SSG).
3. 빌드 출력에 `● (SSG)` 기호와 함께 생성된 경로 3개가 표시됩니다.
4. 이후 요청은 저장된 결과를 그대로 서빙합니다.

참고로 `next dev`에서는 빌드가 아니라 해당 라우트로 이동하는 시점에
`generateStaticParams`가 호출되고, ISR 재검증 시에는 다시 호출되지 않습니다. 즉
파라미터 목록은 **빌드 시점의 스냅샷**입니다.

**Case B — `/products/[id]` (generateStaticParams 없음)**

라우트는 동적 렌더링 대상이 되어 매 요청 서버에서 렌더링합니다. 빌드 출력에서는
`ƒ (Dynamic)`으로 표시됩니다. 이 예시는 두 라우트를 나란히 두고 차이를 비교할 수
있게, 상품 페이지에 일부러 `generateStaticParams`를 넣지 않았습니다. 파일 끝의
주석에 그 의도를 적어 두었습니다.

추가 제어 장치로 `export const dynamicParams = false`를 두면 `generateStaticParams`가
반환하지 않은 경로는 렌더링하지 않고 404를 응답합니다. 기본값은 목록 밖 경로를
요청 시 렌더링하는 것입니다(이 예시는 기본값을 따릅니다).

### 3. 요청 타임라인: `/products/keyboard`

1. **매칭**: 정적 세그먼트 `products`는 정확히 매칭되고, `keyboard`는 `[id]`
   자리표가 잡아챕니다.
2. **params 전달**: Next.js는 잡은 값을 `params` **Promise**로 만들어 `page`,
   `layout`, `generateMetadata`(라우트 핸들러라면 `route`)에 전달합니다.
3. **await**: 페이지가 `const { id } = await params`로 값을 꺼냅니다.
4. **존재 확인**: `getProduct(id)`로 데이터를 찾습니다.
5. **없으면 404, 있으면 렌더**: 없으면 `notFound()`, 있으면 본문 렌더링 →
   RSC 페이로드 + HTML 생성 → 응답.

```text
/products/keyboard
        │
        ├─ "products" ──→ app/products 폴더 (정적 세그먼트, 정확히 매칭)
        └─ "keyboard" ──→ [id] 자리표가 캡처 ──→ params.id = "keyboard"
```

### 4. notFound()의 동작 원리

`notFound()`는 `NEXT_HTTP_ERROR_FALLBACK;404` 에러를 던져 그 세그먼트의 렌더링을
중단시킵니다. 이 에러는 호출 스택을 타고 올라가 **가장 가까운 `not-found` 경계**에서
잡히고, 해당 `not-found.tsx`가 그 자리를 대신 렌더링합니다. 경계가 없으면 상위
경계로, 결국 Next.js의 기본 404까지 올라갑니다. HTTP 상태 코드는 404가 되고, 검색엔진
색인을 막는 `<meta name="robots" content="noindex">` 태그도 함께 주입됩니다.

던지는 방식이라서 두 가지를 조심해야 합니다.

- **렌더 경로에서 호출**해야 합니다. 컴포넌트 본문이나 컴포넌트가 `await`하는 함수
  안에서 호출해야 경계까지 도달합니다. 이벤트 핸들러나 await 하지 않은 Promise 안에
  두면 아무것도 잡아주지 못해 404 UI가 그려지지 않습니다.
- **`try/catch`로 감싸지 말 것**: 에러가 삼켜져 404가 렌더링되지 않습니다.

이 예시의 `ProductPage`는 페이지 최상단에서, 스트리밍이 시작되기 전에 존재를
확인하므로 진짜 404 상태 코드가 응답됩니다. 반면 `<Suspense>` 안처럼 스트리밍이 이미
시작된 뒤에 확인하면 응답 상태 코드는 200으로 나가고 화면만 404로 바뀌는 케이스가
생길 수 있습니다(상태 코드는 스트리밍 시작 후 바꿀 수 없기 때문입니다).

### 5. 서버가 브라우저로 무엇을 보내는가

- **SSG된 페이지**(`/blog/what-is-ssg`): 빌드 때 만들어 둔 HTML을 그대로 보냅니다.
  매 요청의 서버 계산이 없습니다.
- **동적 페이지**(`/products/keyboard`): 매 요청 서버 컴포넌트를 렌더링해 RSC
  페이로드를 만들고, 그것으로 prerender한 HTML을 함께 보냅니다. RSC 페이로드에는
  서버 컴포넌트의 렌더 결과, 클라이언트 컴포넌트가 그려질 자리와 JS 파일 참조,
  서버→클라이언트 props가 담깁니다.

브라우저는 첫 방문에서 HTML로 즉시 화면을 그리고, RSC 페이로드로 트리를 맞추고,
JS로 클라이언트 컴포넌트를 하이드레이션합니다. 이후 `<Link>` 이동에서는 RSC
페이로드만 받아 교체합니다. prefetch 관점에서도 차이가 납니다. SSG된 정적 라우트는
전체가 prefetch 대상이고, 동적 라우트는 prefetch를 건너뛰거나 `loading.tsx` 경계까지만
부분적으로 받아옵니다.

### 6. params가 Promise인 이유 (15에서 도입, 16에서 동기 접근 제거)

Next.js 15에서 `params`, `searchParams`, `cookies()`, `headers()`가 Promise로
바뀌었고, Next.js 16에서는 **동기 접근이 완전히 제거**되어 반드시 `await`해야
합니다. 14 이하에서는 동기 prop이었습니다.

이 변화는 스트리밍과 캐싱을 개선하기 위한 것입니다. 셸을
먼저 보내는 렌더링 모델(예: Cache Components)에서 params는 나중에 도착하는 런타임
데이터가 될 수 있고, Promise여야 껍데기를 먼저 스트리밍한 뒤 값을 기다리는 구성이
가능해집니다. 클라이언트 컴포넌트에서는 `await` 대신 React의 `use()` API나
`useParams()` 훅으로 같은 값을 읽습니다.

## 코드와 함께 보는 설명

### `lib/data.ts` — 데이터와 조회 함수

```ts
// lib/data.ts
export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
```

상품 3개와 글 3개를 배열로 두고, id/slug로 찾는 함수를 제공합니다. 조회 결과가
`undefined`일 수 있다는 점이 `notFound()` 데모의 재료가 됩니다.

### `app/products/[id]/page.tsx` — 동적 라우트 + notFound()

```tsx
// app/products/[id]/page.tsx
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }
  ...
```

- `notFound()`는 반환 타입이 `never`라서 `return notFound()`로 쓰지 않아도 되고,
  if 블록 뒤의 코드에서는 `product`가 정의되어 있다는 타입 좁아짐이 그대로 유지됩니다.
- 같은 파일의 `generateMetadata`도 같은 Promise params를 `await`해 상품 이름을
  `title`로 만듭니다. 페이지와 메타데이터가 params를 공유하는 전형적인 형태입니다.
- 파일 끝 주석처럼, 여기에 `generateStaticParams`를 추가하면 이 페이지도 SSG가
  됩니다. 2번(블로그)과 비교하려고 의도적으로 빼 두었습니다.

### `app/blog/[slug]/page.tsx` — generateStaticParams로 SSG

```tsx
// app/blog/[slug]/page.tsx
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
```

- 반환 형태는 객체 배열입니다. 각 객체가 하나의 라우트를 나타내고, 프로퍼티 이름
  (`slug`)은 폴더 이름(`[slug]`)과 반드시 같아야 합니다.
- `generateMetadata`에서 `description`을 글 본문 앞부분으로 채워 메타데이터도
  함께 정적 생성됩니다.
- 목록에 없는 slug로 접근하면 페이지 본문의 `notFound()`가 404를 만듭니다.

### `app/docs/[...path]/page.tsx` — 캐치올 세그먼트

```tsx
// app/docs/[...path]/page.tsx
export default async function DocsPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;   // 예: ["guides", "routing", "dynamic"]
```

깊이에 상관없이 남은 세그먼트를 전부 배열로 받습니다. 페이지 안에 URL과 `params`의
대응 표를 렌더링하여 `/docs/guides/routing/dynamic`가 `["guides", "routing",
"dynamic"]`로 분해되는 것을 직접 보여줍니다.

### `app/files/[[...path]]/page.tsx` — 선택적 캐치올 세그먼트

```tsx
// app/files/[[...path]]/page.tsx
export default async function FilesPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
```

대괄호가 두 겹입니다. `/files`에서는 `path`가 `undefined`라서 타입에 `?`가 붙고,
페이지도 `path ? JSON.stringify(path) : "undefined"`로 두 경우를 모두 렌더링합니다.

### `app/not-found.tsx` — 전체 앱 폴백

`/products/not-exist`처럼 `notFound()`가 호출되었을 때, 또는 매칭되는 라우트가
없을 때 렌더링됩니다. 루트에만 두었으므로 전체 앱이 이 화면을 공유합니다. 특정
섹션에 `not-found.tsx`를 추가하면 그 폴더가 가장 가까운 경계가 됩니다.

### `app/page.tsx` — 4가지 패턴 링크 모음

각 패턴으로 가는 `<Link>` 목록을 제공합니다. `products.map`, `posts.map`으로 링크를
만드는 부분은 동적 세그먼트로 가는 링크를 템플릿 리터럴(`href={`/products/${p.id}`}`)로
조립하는 표준적인 방식입니다.

## 핵심 개념

### params는 Promise입니다 (Next.js 15+)

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;   // 반드시 await
}
```

`params`, `searchParams`, `cookies()`, `headers()`가 전부 Promise가 되었습니다.
Next.js가 스트리밍·캐싱을 개선하기 위한 변화입니다. Next.js 16에서는 동기 접근이
완전히 제거되어 `await`가 선택이 아닌 필수가 되었습니다.

### 없는 데이터는 `notFound()`

```tsx
if (!product) notFound();   // throw 없이 선언적으로 404
```

가장 가까운 `not-found.tsx`가 렌더링되고 HTTP 상태는 404가 됩니다. "throw 없이"라는
말은 호출 코드에 `throw`를 직접 쓰지 않는다는 뜻이고, 내부적으로는 에러를 던져
렌더링을 중단시키는 방식으로 동작합니다.

### `generateStaticParams` = 빌드 시 SSG

```tsx
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}
```

반환한 파라미터들은 **빌드 중에 HTML로 생성**됩니다. 빌드 출력:

```
├   /blog/[slug]
│ ├ ● /blog/what-is-ssg          ← SSG로 생성됨
│ ├ ● /blog/what-is-isr
│ └ ● /blog/params-are-a-promise
```

`next build`에서는 대응하는 페이지·레이아웃 생성 전에 이 함수가 먼저 실행되고,
ISR 재검증 시에는 다시 실행되지 않습니다. `fetch`로 목록을 가져오는 경우 같은
요청은 자동으로 메모이제이션되어 중복 호출이 없습니다.

## 정량 비교: SSG vs 요청 시 렌더링

| 방식 | 첫 요청 처리 | 서버 부하 |
| --- | --- | --- |
| `generateStaticParams` (SSG) | 저장된 HTML 즉시 전송 — **서버 계산 0** | 트래픽과 무관 |
| 동적 렌더링 (`/products/[id]`) | 매 요청 렌더링 | 요청 수에 비례 |

`pnpm build` 출력에서 `/blog/*`는 `● (SSG)`, `/products/[id]`는 `ƒ (Dynamic)`으로
표시되는 것을 직접 확인할 수 있습니다.

prefetch에서도 같은 차이가 이어집니다. 정적 라우트는 `<Link>`가 뷰포트에 들어올 때
전체가 미리 받아지지만, 동적 라우트는 prefetch를 건너뛰거나 `loading.tsx` 경계까지만
부분적으로 받아옵니다. 동적 라우트의 전환 경험을 살리려면 `loading.tsx`를 두는 것이
좋습니다.

## 좋은 활용 사례

- 상품/블로그 상세 페이지 → `[slug]` + `generateStaticParams`
- 문서 사이트의 깊은 경로 → `[...path]`
- 파일 브라우저처럼 루트 경로도 필요한 경우 → `[[...path]]`
- 존재하지 않는 id는 반드시 `notFound()` — 빈 화면 대신 404

## 흔한 오해와 주의점

1. **"params는 그냥 쓰면 된다"** — Next.js 16에서는 `params`가 항상 Promise이며
   동기 접근이 제거되었습니다. `await params` 없이 `params.id`를 읽으면 런타임에
   실패합니다. 클라이언트 컴포넌트에서는 `use(params)`나 `useParams()`를 씁니다.
2. **"notFound() 주변을 try/catch로 감싸도 된다"** — 에러가 삼켜져 404 UI가
   렌더링되지 않습니다. `notFound()`는 가장 가까운 `not-found` 경계까지 에러가
   올라가야 동작합니다.
3. **"`[...path]`가 `/docs` 자체도 잡아준다"** — 캐치올은 세그먼트가 하나 이상
   있어야 매칭됩니다. 파라미터 없는 경로까지 받으려면 `[[...path]]`를 써야 합니다.
4. **"generateStaticParams에 없는 값은 전부 404다"** — 기본 동작은 아닙니다.
   `dynamicParams`가 기본값(true)이면 목록 밖 경로는 요청 시 동적으로 렌더링됩니다.
   404로 막으려면 `export const dynamicParams = false`가 필요합니다.
5. **"ISR 재검증 때 파라미터 목록도 갱신된다"** — `generateStaticParams`는 재검증
   시점에 다시 호출되지 않습니다. 글 목록이 늘었다면 재배포가 필요하거나, 목록 밖
   새 글은 첫 요청 시 런타임 렌더링으로 만들어집니다.

## DX 개선

- 라우트 정의와 파라미터 추출이 파일명으로 통일 — 별도 라우트 등록 코드 없음
- 타입: `params`의 형태가 폴더 구조에서 유추되어 실수가 줄어듦
- SSG 여부가 코드(`generateStaticParams` 유무)에서 그대로 드러남

## 관련 문서

- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
- [Dynamic Route Segments (파일 규칙)](https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes) — 세 가지 형태의 매칭 표, params 타입
- [notFound](https://nextjs.org/docs/app/api-reference/functions/not-found) — 예외 전파, noindex 주입, 스트리밍 이후 상태 코드
- [not-found 파일 규칙](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) — 정적/동적 라우트의 prefetch 차이
- [Next.js 16 릴리스 노트](https://nextjs.org/blog/next-16) — 동기 params 접근 제거
