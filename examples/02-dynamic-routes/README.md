# 02 — 동적 라우팅

> `[폴더]`로 URL 파라미터를 만들고, `generateStaticParams`로 빌드 시점에 미리 렌더링합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 4가지 동적 라우트 패턴

| 패턴 | 폴더 이름 | 예시 URL | 받는 값 |
| --- | --- | --- | --- |
| 기본 | `[id]` | `/products/keyboard` | `{ id: "keyboard" }` |
| 캐치올 | `[...path]` | `/docs/a/b/c` | `{ path: ["a","b","c"] }` |
| 선택적 캐치올 | `[[...path]]` | `/files` 도 매칭 | `{ path?: [...] }` |
| SSG 결합 | `generateStaticParams` | 빌드 시 HTML 생성 | — |

## 핵심 개념

### params는 Promise입니다 (Next.js 15+)

```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;   // 반드시 await
}
```

`params`, `searchParams`, `cookies()`, `headers()`가 전부 Promise가 되었습니다.
Next.js가 스트리밍·캐싱을 개선하기 위한 변화입니다.

### 없는 데이터는 `notFound()`

```tsx
if (!product) notFound();   // throw 없이 선언적으로 404
```

가장 가까운 `not-found.tsx`가 렌더링되고 HTTP 상태는 404가 됩니다.

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

## 정량 비교: SSG vs 요청 시 렌더링

| 방식 | 첫 요청 처리 | 서버 부하 |
| --- | --- | --- |
| `generateStaticParams` (SSG) | 저장된 HTML 즉시 전송 — **서버 계산 0** | 트래픽과 무관 |
| 동적 렌더링 (`/products/[id]`) | 매 요청 렌더링 | 요청 수에 비례 |

`pnpm build` 출력에서 `/blog/*`는 `● (SSG)`, `/products/[id]`는 `ƒ (Dynamic)`으로
표시되는 것을 직접 확인할 수 있습니다.

## 좋은 활용 사례

- 상품/블로그 상세 페이지 → `[slug]` + `generateStaticParams`
- 문서 사이트의 깊은 경로 → `[...path]`
- 파일 브라우저처럼 루트 경로도 필요한 경우 → `[[...path]]`
- 존재하지 않는 id는 반드시 `notFound()` — 빈 화면 대신 404

## DX 개선

- 라우트 정의와 파라미터 추출이 파일명으로 통일 — 별도 라우트 등록 코드 없음
- 타입: `params`의 형태가 폴더 구조에서 유추되어 실수가 줄어듦
- SSG 여부가 코드(`generateStaticParams` 유무)에서 그대로 드러남

## 관련 문서

- [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)
