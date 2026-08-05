# 24 — 정적 export

> `output: "export"`로 순수 정적 파일(HTML/CSS/JS)을 만들어 아무 데나 배포합니다.

빌드 시점에 모든 라우트의 HTML을 완성해서 `out/` 폴더에 출력하는 모드입니다.
결과물은 순수 정적 파일이라 Node.js 서버 없이 아무 정적 호스팅에 올릴 수
있고, 대신 요청 시점에 서버가 개입하는 기능은 쓸 수 없습니다.

## 실행 / 빌드

```bash
pnpm install
pnpm build          # out/ 폴더에 정적 파일 생성
npx serve out       # 로컬에서 서빙 확인
```

빌드가 끝나면 `out/` 폴더가 생깁니다. 파일 트리를 직접 열어보면 각 라우트가
어떤 파일로 바뀌었는지 확인할 수 있습니다 (`out/index.html`,
`out/blog/first.html` 등).

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `next.config.ts` | `output: "export"` 설정과 `images.unoptimized`가 필요한 이유 |
| `app/blog/[slug]/page.tsx` | `generateStaticParams`로 동적 라우트를 정적 파일로 만드는 과정 |
| `app/client/page.tsx` | 정적 export 후에도 남는 클라이언트 인터랙션 |
| `out/` | 빌드가 실제로 만들어낸 HTML/CSS/JS 결과물 |

## 동작 원리

### output:"export"가 빌드 시 하는 일

`next build`는 원래 서버 번들과 정적 파일을 함께 만들지만, `output: "export"`
모드에서는 **라우트마다 완성된 HTML 파일을 생성해 `out/`에 출력**하는 것이
빌드의 핵심 결과물이 됩니다. 공식 문서의 설명을 빌리면, `next build`는
라우트당 HTML 파일 하나를 생성합니다. SPA를 하나의 거대한 번들로 내보내는
대신 라우트별 HTML 파일로 쪼개기 때문에, 방문한 페이지에 필요 없는
자바스크립트까지 브라우저가 내려받지 않아도 됩니다.

이 과정에서 일어나는 일은 전통적인 정적 사이트 생성(SSG)과 같습니다.

1. `app/` 디렉터리의 **서버 컴포넌트는 빌드 중에 실행**됩니다. 빌드 시점에
   한 `fetch`도 이 단계에서 처리됩니다.
2. 렌더링 결과는 두 가지 형태로 저장됩니다. 최초 로드를 위한 **정적 HTML**,
   그리고 `<Link>`로 이동할 때 쓰는 **클라이언트 내비게이션용 페이로드**.
3. 브라우저 자바스크립트 청크(`_next/static/...`)도 함께 출력되어, 첫 로드는
   HTML로 빠르게 하고 이후 탐색은 하이드레이션된 앱처럼 부드럽게 동작합니다.

이 예시를 빌드했을 때 실제로 나온 `out/` 구조입니다.

```
out/
  index.html          ← "/" 라우트
  404.html            ← not-found 페이지
  client.html         ← "/client" 라우트
  blog/first.html     ← generateStaticParams로 생성
  blog/second.html
  _next/              ← JS 청크·정적 에셋
  index.txt, client.txt, blog/first.txt ...
                      ← 클라이언트 내비게이션용 페이로드
```

라우트 하나가 파일 하나로 대응하는 구조라, 웹 서버는 이 파일들을 그대로
서빙하기만 하면 됩니다.

### generateStaticParams로 동적 라우트를 정적 파일로 만드는 과정

`/blog/[slug]` 같은 동적 라우트는 URL이 무한히 나올 수 있습니다. 서버가
있다면 요청을 받은 뒤 파라미터를 보고 렌더링하면 되지만, 정적 export에는
"요청을 받는 시점"이 없습니다. 그래서 **빌드 시점에 어떤 slug들의 HTML을
미리 만들지 목록으로 알려줘야** 하고, 그 역할을 하는 것이
`generateStaticParams`입니다.

이 예시의 `app/blog/[slug]/page.tsx`는 이렇게 생겼습니다.

```ts
// app/blog/[slug]/page.tsx
const posts: Record<string, { title: string; body: string }> = {
  first: { title: "첫 번째 글", body: "..." },
  second: { title: "두 번째 글", body: "..." },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}
```

빌드는 이 목록을 받아 `[{ slug: "first" }, { slug: "second" }]` 각 항목마다
페이지 컴포넌트를 한 번씩 렌더링하고, 그 결과로
`out/blog/first.html`, `out/blog/second.html` 파일을 씁니다.

반대로 말하면, 목록에 없는 slug는 파일이 만들어지지 않습니다.
`/blog/third`로 접근하면 404입니다. 파라미터를 빌드 전에 알 수 없는 라우트
(요청 시점에 ID를 받아야 하는 라우트)는 정적 export로 만들 수 없습니다.
이것이 아래 "금지되는 기능" 목록과 연결됩니다.

### 동적 렌더링과 서버 전용 기능이 금지되는 이유

정적 export의 결과물은 **빌드가 끝나는 순간 확정된 파일 묶음**입니다. 배포
후에는 파일을 서빙하는 것 외에 아무 일도 일어나지 않습니다. 그래서 다음
기능들은 원리적으로 성립하지 않습니다.

- **요청 시점의 정보** — `cookies()`, `headers()`, Route Handler의 `Request`
  객체 등은 "지금 들어오는 요청"을 봐야 알 수 있는 값입니다. 빌드 시점에
  만들어지는 파일에는 담을 수 없습니다.
- **빌드 이후의 갱신** — `revalidate`, ISR은 "배포 후에 페이지를 다시
  만드는" 기능입니다. 다시 만들 서버가 없으니 성립하지 않습니다.
- **요청마다 실행되는 로직** — `proxy.ts`(미들웨어), Server Actions,
  리다이렉트/리와라이트/헤더 설정은 요청이 들어올 때마다 서버가 판단해야
  하는 것들입니다.

예외가 하나 있습니다. **Route Handler도 GET이면서 결과가 빌드 시점에
확정되는 경우**에는 정적 파일로 export됩니다. 예를 들어
`app/data.json/route.ts`에서 `GET`이 고정된 JSON을 반환하면, 빌드 결과로
`out/data.json` 파일이 생깁니다. 하지만 요청의 동적 값을 읽는 용도로는 쓸 수
없습니다.

이 규칙들은 빌드 때까지 기다리지 않아도 됩니다. `next dev`에서 이 기능들을
쓰려고 하면 루트 레이아웃에 `export const dynamic = "error"`를 설정한 것과
같은 종류의 에러가 즉시 발생합니다.

### out/을 아무 정적 호스팅에 올릴 수 있는 이유와 제약

요구사항이 단 하나입니다. **HTML/CSS/JS 정적 파일을 서빙할 수 있는 웹
서버면 됩니다.** GitHub Pages, S3+CloudFront, Netlify, nginx 전부 됩니다.
Node.js 프로세스도, 프레임워크 런타임도 필요 없습니다.

다만 "라우트 → 파일" 연결 방식을 호스트가 알아야 합니다. `/blog/first`
요청이 왔을 때 어떤 파일을 줄지는 호스트 설정의 몫입니다.

- `npx serve out`이나 Netlify/GitHub Pages처럼 `.html` 파일을 자동으로 찾아
  주는 호스트는 그대로 됩니다.
- nginx처럼 파일 경로만 보는 서버는 리와라이트 규칙이 필요합니다:

```nginx
# 공식 문서 예시 (trailingSlash: false 기준)
location / {
    try_files $uri $uri.html $uri/ =404;
}
location /blog/ {
    rewrite ^/blog/(.*)$ /blog/$1.html break;
}
```

- 폴더 + `index.html` 스타일을 선호하면 `next.config.ts`에
  `trailingSlash: true`를 넣으면 됩니다. 링크는 `/me` → `/me/`로 바뀌고,
  출력은 `me.html` 대신 `me/index.html`이 됩니다. 이 경우 위 nginx의
  `/blog/` 리와라이트는 필요 없습니다.

제약도 이 모드 특유의 것들입니다. 서버가 없으니 `next/image`의 기본 이미지
최적화(요청 시 리사이즈)를 쓸 수 없어 `unoptimized`나 커스텀 로더가
필요하고, 미들웨어/proxy도 없습니다. 자세한 목록은 아래 "쓸 수 있는 것 /
없는 것" 표에 정리했습니다.

### 정적으로 내보내도 클라이언트 인터랙션은 그대로 동작합니다

`/client` 페이지가 그 증거입니다. 사전 렌더링된 HTML이 먼저 도착해 즉시
보이고, 이어서 자바스크립트가 하이드레이션되면서 `useState` 카운터 같은
인터랙션이 살아납니다. 정적 export는 "인터랙션이 없는 사이트"가 아니라
"서버가 요청마다 개입하지 않는 사이트"를 의미합니다.

## 코드와 함께 보는 설명

### `next.config.ts`

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  // 정적 export는 next/image의 서버 사이드 최적화 API를 쓸 수 없어서
  // unoptimized 로 두거나 커스텀 로더를 써야 합니다.
  images: {
    unoptimized: true,
  },
};
```

필요하면 `distDir: "dist"`로 출력 폴더 이름을 바꾸거나, `trailingSlash`,
`skipTrailingSlashRedirect`로 라우트와 파일의 대응 방식을 조절할 수
있습니다.

### `app/blog/[slug]/page.tsx` — SSG 페이지

```tsx
// app/blog/[slug]/page.tsx (렌더링 부분)
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();
  // ... slug에 맞는 글 렌더링
}
```

이 컴포넌트는 `generateStaticParams`가 반환한 slug마다 빌드 중에 한 번씩
실행됩니다. 배포 후 서버에서 다시 실행되는 일은 없습니다.

### `app/client/page.tsx` — 하이드레이션으로 살아나는 인터랙션

```tsx
// app/client/page.tsx
"use client";

import { useState } from "react";

export default function ClientPage() {
  const [count, setCount] = useState(0);
  // ... "+1" 버튼: setCount((c) => c + 1)
}
```

`"use client"` 컴포넌트도 빌드 시점에 HTML로는 한 번 렌더링됩니다(프리렌더).
단, 이때는 브라우저가 없으므로 `window`, `localStorage` 같은 브라우저 API는
`useEffect` 안처럼 브라우저에서 실행되는 시점에만 접근해야 합니다.

### 실제 빌드 결과물 `out/` 읽기

이 예시를 `pnpm build` 했을 때 실제로 생성된 구조입니다.

```
out/
  index.html                # "/"
  client.html               # "/client"
  404.html                  # 호스팅에서 404 처리용으로 쓰는 파일
  _not-found.html           # Next.js not-found 라우트의 렌더링 결과
  blog/first.html           # generateStaticParams가 만든 파일
  blog/second.html
  blog/first/...            # 해당 라우트용 내비게이션 페이로드
  _next/static/...          # JS 청크·CSS 등 정적 에셋
  index.txt, client.txt ... # 클라이언트 내비게이션용 페이로드
```

눈여겨볼 것이 두 개 있습니다. 첫째, `blog/first.html` **파일**과
`blog/first/` **폴더**가 함께 있습니다. HTML은 최초 방문용이고, 폴더 안의
페이로드는 앱이 하이드레이션된 뒤 `<Link>`로 `/blog/first`에 이동할 때
쓰입니다. 둘째, `.txt` 페이로드들은 서버 컴포넌트의 렌더링 결과를 직렬화한
것이라, 클라이언트 내비게이션 때도 페이지 전체를 다시 받지 않고 라우트
전환이 가능합니다. 이 파일들은 전부 "빌드 시점에 확정된 것"이라는 공통점이
있습니다 — 서버가 없어도 내비게이션이 SPA처럼 동작하는 이유입니다.

## 쓸 수 있는 것 / 없는 것

| 가능 | 불가능 |
| --- | --- |
| 페이지, 레이아웃, 클라이언트 JS | Route Handlers, Server Actions |
| `generateStaticParams` SSG | `proxy.ts`/middleware |
| 정적 자산 서빙 | ISR, `cookies()`/`headers()` 읽기 |
| | 동적 렌더링 (`force-dynamic`) |

공식 문서의 "지원하지 않는 기능" 전체 목록은 이렇습니다: `dynamicParams:
true`인 동적 라우트, `generateStaticParams` 없는 동적 라우트, `Request`에
의존하는 Route Handler, `cookies()`, rewrites, redirects, headers 설정,
proxy, ISR, 기본 loader의 이미지 최적화, Draft Mode, Server Actions,
인터셉팅 라우트.

표에서 "Route Handlers 불가능"은 요청 동적 값을 읽는 경우를 뜻합니다.
위 "동작 원리"에서 본 것처럼 GET이면서 결과가 빌드 시점에 고정된 핸들러는
예외적으로 정적 파일로 export됩니다.

## 정량 비교: 정적 export vs 서버 배포

| 항목 | 정적 export | 서버 배포 |
| --- | --- | --- |
| 호스팅 비용 | **CDN/무료 정적 호스팅 가능** | 서버 런타임 필요 |
| 확장성 | CDN이 자동 처리 | 인스턴스 확장 필요 |
| 보안 표면 | 공격 표면 최소 (서버 없음) | 서버 취약점 관리 필요 |
| 가능한 기능 | 정적 콘텐츠 한정 | 전체 |

## 좋은 활용 사례

- 마케팅 사이트, 문서, 포트폴리오, 랜딩 페이지
- 로그인/개인화/실시간 데이터가 없는 모든 사이트
- 처음엔 정적으로 시작 → 필요해지면 서버 기능 추가 (같은 코드베이스)
- 콘텐츠가 빌드 주기로 갱신되는 블로그·문서 사이트 — CMS 웹훅으로 빌드만
  다시 돌리면 됩니다
- 데이터가 필요하면 빌드 시 fetch로 가져오거나(서버 컴포넌트), 브라우저에서
  클라이언트 fetch/SWR로 가져오는 구조로 설계

## DX 개선

- 배포가 "파일 복사" — 서버 프로세스 관리, 헬스체크, 스케일링 없음
- GitHub Pages/Netlify/S3 등 정적 호스팅과 바로 통합

## 흔한 오해와 주의점

1. **`next start`가 배포 방식이 아닙니다.** 이 모드의 결과물은 `out/` 폴더
   자체입니다. `pnpm start`(next start)를 돌리는 대신 `out/`을 정적 서버에
   올리세요.
2. **`next/image`는 그대로 쓰면 안 됩니다.** 서버가 없어 요청 시 최적화가
   불가능합니다. `images.unoptimized`(원본 서빙) 또는 Cloudinary 같은 외부
   서비스의 커스텀 로더 둘 중 하나가 필요합니다.
3. **동적 라우트는 목록에 있는 것만 만들어집니다.**
   `generateStaticParams`가 반환하지 않은 slug는 HTML 파일 자체가 없어서
   404입니다. "배포 후 첫 방문 때 만들어지기"를 기대할 수 없습니다.
4. **클라이언트 컴포넌트도 빌드 시 렌더링됩니다.** 프리렌더 단계에서
   `window`에 접근하면 빌드가 실패합니다. 브라우저 API는 `useEffect`나 이벤트
   핸들러 안에서만 쓰세요.
5. **나중에 서버 기능이 필요해지면 갈아탈 수 있습니다.** 정적 export는
   "시작점"으로도 설계된 모드입니다. `output` 설정만 바꾸면 같은 코드베이스를
   서버 배포(예: 25 예시의 standalone)로 옮길 수 있습니다.

## 관련 문서

- [정적 export 가이드](https://nextjs.org/docs/app/guides/static-exports) — 지원 기능·nginx 설정·커스텀 이미지 로더 예시
- [output 설정](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — `export`/`standalone` 모드 비교
- [Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting) — 서버 배포로 옮길 때 참고
