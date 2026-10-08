# 09 — proxy.ts (middleware의 새 이름)

> 모든 요청이 페이지에 도달하기 전에 실행되는 함수. 헤더·리다이렉트·리라이트·접근 제어를 담당합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 데모 | proxy 동작 |
| --- | --- |
| `/headers` | 요청 헤더에 `x-request-id` 심기 → 페이지에서 읽기 |
| `/admin` | 쿠키 없으면 `/login?from=/admin`으로 리다이렉트 |
| `/old-blog/hello` | `/blog/hello`로 리라이트 (URL 유지) |
| `/legacy` | 홈으로 리다이렉트 |
| proxy를 통과한 일반 응답 | `x-powered-by-proxy` 헤더 추가 (DevTools에서 확인. 정적 에셋, 리다이렉트, 리라이트 응답 제외) |

## 동작 원리

### middleware에서 proxy로 바뀐 배경 (Next.js 16)

Next.js 16부터 미들웨어의 이름이 proxy로 바뀌었습니다. 공식 문서 표현을
그대로 옮기면 이렇습니다.

> Starting with Next.js 16, Middleware is now called Proxy to better reflect
> its purpose. The functionality remains the same.

이름만 바뀌었고 동작은 동일합니다. 그런데 왜 바꿨을까요? 공식 마이그레이션
문서가 든 이유는 두 가지입니다.

- **"middleware"라는 이름이 Express.js의 미들웨어와 자주 혼동된다.**
  Express 미들웨어는 라우트마다 체인으로 끼워 넣는 개념인데, Next.js의
  이 기능은 그런 것이 아닙니다. 이름이 역할을 잘못 암시해서 오용을
  부추긴다는 것입니다.
- **"proxy"라는 이름이 실제 역할과 더 잘 맞는다.** 이 코드는 앱 앞에 놓인
  네트워크 경계입니다. 앱의 메인 런타임 바깥에서 실행될 수도 있고, 요청이
  앱에 도달하기 전에 가로채서 처리합니다.

| 항목 | 이전 | Next 16 |
| --- | --- | --- |
| 파일명 | `middleware.ts` | **`proxy.ts`** |
| export | `middleware` | `proxy` (default export도 가능) |
| 상태 | — | `middleware.ts`는 deprecated (동작은 함) |

자동 변환 도구도 있습니다:

```bash
npx @next/codemod@canary middleware-to-proxy .
```

파일 위치는 프로젝트 루트(또는 `src` 사용 시 `src` 안)에서 `app`/`pages`와
같은 계층입니다. 프로젝트당 **하나만** 허용되며, 로직이 커지면 여러 모듈로
나눠서 `proxy.ts`에서 불러오는 방식이 권장됩니다.

### 요청 파이프라인에서 어느 시점에 실행되는가

공식 문서는 "Proxy executes before routes are rendered"라고 정의합니다.
즉, 어떤 페이지가 렌더링될지 결정되기 **이전**에 실행됩니다. 정확한 실행
순서는 이렇습니다.

1. `next.config.ts`의 `headers`
2. `next.config.ts`의 `redirects`
3. **proxy** (rewrite, redirect 등)
4. `next.config.ts`의 `beforeFiles` rewrite
5. 파일시스템 라우트 (`public/`, `_next/static/`, `app/`, `pages/` 등)
6. `next.config.ts`의 `afterFiles` rewrite
7. 동적 라우트 (`/blog/[slug]`)
8. `next.config.ts`의 `fallback` rewrite

proxy는 3번입니다. 실제 페이지 파일이 매칭되는 5번, 동적 세그먼트가
매칭되는 7번보다 먼저 실행됩니다. 그래서 proxy에서 리다이렉트를 반환하면
페이지 코드는 **아예 실행되지 않습니다.** 라우트 매칭 자체를 가로채는
위치라는 것이 핵심입니다.

한 가지 더: Server Function은 독립적인 라우트가 아니라, 그것이 사용되는
라우트로 가는 POST 요청으로 처리됩니다. 그래서 어떤 경로를 matcher에서
제외하면 그 경로에서 호출되는 Server Function도 proxy를 거치지 않습니다.
proxy만 믿지 말고 Server Function 안에서도 인증·인가를 직접 확인해야 하는
이유 중 하나입니다.

### matcher로 실행 대상 좁히기

matcher가 없으면 proxy는 **모든 요청**에서 실행됩니다. 정적 파일
(`_next/static`), 이미지 최적화(`_next/image`), `public/` 폴더의 에셋까지
포함입니다. 인증 로직이 CSS/JS/이미지 로딩까지 가로막을 수 있으니, 보통은
부정 매칭 패턴으로 이런 경로를 제외합니다.

```ts
// 09-proxy/proxy.ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

이 예시의 matcher를 읽으면: "경로가 `_next/static`, `_next/image`,
`favicon.ico`로 시작하는 경우를 **제외한** 모든 경로"입니다. `(?!...)`는
정규식의 negative lookahead(앞으로 이 문자열이 안 나오면 매칭)입니다.

matcher 사용 규칙:

- 문자열 하나 또는 배열(`['/about/:path*', '/dashboard/:path*']`) 가능
- 정규식을 완전히 지원하므로 negative lookahead 같은 복잡한 패턴 가능
- **값은 상수여야 합니다.** 빌드 시 정적 분석으로 처리되기 때문에 변수를
  넣으면 무시됩니다.
- 객체 배열 형식으로 `has`/`missing` 조건(헤더 유무 등)을 걸 수도 있습니다.
  프리플라이트 요청을 proxy에서 제외하는 최적화에 쓰입니다.

참고로 부정 매칭 패턴에서 `_next/data`를 제외하더라도 proxy는
`_next/data` 라우트에 여전히 실행됩니다. 페이지는 보호하면서 그 페이지의
데이터 라우트를 깜빡 잊고 노출하는 보안 실수를 막기 위한 의도적 동작입니다.

### NextRequest/NextResponse로 할 수 있는 것

proxy 함수는 `NextRequest`를 인자로 받고 `NextResponse`(또는 일반
`Response`)를 반환합니다. 두 번째 인자로 `NextFetchEvent`를 받을 수 있고,
`event.waitUntil(promise)`로 응답을 보낸 뒤에도 백그라운드 작업(로그 전송
등)을 끝까지 기다리게 할 수 있습니다.

이 예시가 사용하는 기능들을 분류하면:

| 기능 | API | 예시의 용도 |
| --- | --- | --- |
| 요청 헤더 수정 | `new Headers(request.headers)` 후 `NextResponse.next({ request: { headers } })` | `x-request-id` 심기 |
| 리다이렉트 | `NextResponse.redirect(url)` | `/legacy` → 홈, 비로그인 → `/login` |
| 리라이트 | `NextResponse.rewrite(url)` | `/old-blog/:slug` → `/blog/:slug` |
| 응답 헤더 추가 | `response.headers.set(...)` | `x-powered-by-proxy` |
| 쿠키 읽기 | `request.cookies.get(...)` | `auth` 쿠키 확인 |
| 그대로 통과 | `NextResponse.next()` | 그 외 모든 요청 |

요청 헤더를 수정할 때의 함정 하나: `NextResponse.next({ request: { headers } })`로
넘겨야 **업스트림(페이지, 라우트 핸들러)** 에 전달됩니다.
`NextResponse.next({ headers })`로 넘기면 그 헤더는 클라이언트로 가는
**응답** 헤더가 됩니다. 이 예시는 둘 다 사용합니다 — 요청 헤더로는
`x-request-id`를 페이지에 전달하고, 응답 헤더로도 같은 값을 붙여
DevTools에서 확인하게 합니다.

proxy에서 `Response.json({ ... }, { status: 401 })`처럼 응답을 직접 만들어
반환할 수도 있습니다. 라우트를 거치지 않고 그 자리에서 응답을 끝내는
것입니다.

### rewrite: URL은 유지한 채 라우트만 바꾸는 원리

리다이렉트와 리라이트의 차이는 **주소창**입니다.

- 리다이렉트: 서버가 "저기로 가세요"(30x 응답)를 보내고, 브라우저가 새
  주소로 다시 요청합니다. 주소창이 바뀝니다.
- 리라이트: 브라우저는 아무것도 모릅니다. 주소창은 그대로인데, 서버
  내부에서만 다른 라우트를 렌더링해서 돌려줍니다.

```ts
// 09-proxy/proxy.ts
if (pathname.startsWith("/old-blog/")) {
  const slug = pathname.replace("/old-blog/", "");
  const target = new URL(`/blog/${slug}`, request.url);
  return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
}
```

`/old-blog/hello`로 들어오면 브라우저 주소창은 `/old-blog/hello`로
남아 있지만, 실제로 렌더링되는 파일은 `app/blog/[slug]/page.tsx`입니다.
RSC(React Server Components) 요청이 끼어 있어도 `NextResponse.rewrite()`가
필요한 RSC 헤더를 자동으로 전달해 주므로, HTML 요청과 RSC 요청이 어긋나는
문제는 Next.js가 처리합니다. 쓰임새: 기존 URL을 유지한 채 사이트 구조
개편, A/B 테스트 그룹별 라우팅, 다국어 기본 경로 등.

### 런타임 제약

Next.js 16부터 proxy는 **Node.js 런타임이 기본**입니다. 그리고 proxy
파일에서는 `runtime` 설정 옵션 자체가 제공되지 않습니다 — 설정하면
에러가 납니다. 버전 역사:

| 버전 | 변화 |
| --- | --- |
| 15.2 | 미들웨어 Node.js 런타임 실험 기능 등장 |
| 15.5 | 미들웨어 Node.js 런타임 안정화 |
| 16.0 | 미들웨어 deprecated + proxy로 이름 변경, **Node.js 런타임 기본** |

과거 Edge 런타임 전용 시절과 달리 Node.js 기본이 되면서, npm 패키지나
Node 내장 모듈을 제약 없이 쓸 수 있게 되었습니다. 그래도 지켜야 할 선은
있습니다:

- proxy는 **느린 데이터 조회용이 아닙니다.** 공식 문서도 명시합니다.
  prefetch된 라우트를 포함해 모든 요청에서 실행될 수 있으므로, DB 조회는
  성능 문제를 일으킵니다.
- proxy 안에서 `fetch`에 `options.cache`, `options.next.revalidate`,
  `options.next.tags`를 지정해도 효과가 없습니다.
- proxy는 렌더 코드와 분리되어 호출되며, 최적화된 환경에서는 CDN에 배포돼
  빠른 redirect/rewrite 처리를 담당할 수 있습니다. 그래서 전역 변수나 공유
  모듈 상태에 의존하면 안 됩니다.
- 정적 내보내기(static export) 배포에서는 지원되지 않습니다.

### 이 예시의 proxy.ts 순서도

`09-proxy/proxy.ts`의 실제 로직을 요청 흐름으로 그리면:

```
요청 도착 (matcher 통과한 경로만)
  │
  ├─ 1) 랜덤 ID 생성 → 요청 헤더 클론에 x-request-id 심기
  │
  ├─ 2) /legacy 인가? ── 예 → 홈(/)으로 리다이렉트 (여기서 종료)
  │
  ├─ 3) /admin/* 인가? ── 예 ─┬─ auth 쿠키 === "1" → 통과
  │                            └─ 아니면 /login?from=<경로>로 리다이렉트
  │
  ├─ 4) /old-blog/* 인가? ── 예 → /blog/<slug>로 리라이트 (여기서 종료)
  │
  └─ 5) 그 외: NextResponse.next()로 통과시키면서
         요청 헤더(x-request-id)를 업스트림에 전달하고,
         응답 헤더에 x-request-id + x-powered-by-proxy 추가
```

1단계가 매번 실행되므로, 리다이렉트·리라이트 응답을 제외한 모든 통과
경로에서 페이지가 `x-request-id`를 읽을 수 있습니다.

### 정량 비교: proxy 게이트 vs 페이지에서만 검사

| 방식 | 비로그인 사용자가 `/admin` 접근 시 |
| --- | --- |
| proxy 게이트 있음 | 렌더링 시작 전에 리다이렉트 — **페이지 코드 실행 0** |
| 페이지에서만 검사 | 페이지 전체 렌더링 시작 후 redirect (계산 일부 낭비) |

proxy는 빠르지만 **낙관적 검사**입니다. `/admin` 페이지는 서버 컴포넌트에서
쿠키를 다시 확인합니다(이중 방어). 프록시를 우회하는 경로까지 막으려면
이렇게 데이터 소스 근처에서 한 번 더 검증해야 합니다. 서명된 토큰 검증까지
포함한 전체 패턴은 20-auth-patterns 예시에서 다룹니다.

## 코드와 함께 보는 설명

### `proxy.ts` — 전체 로직

```ts
// 1) 요청 헤더에 ID를 심어서 페이지/라우트 핸들러에서 읽게 합니다.
const requestId = Math.random().toString(36).slice(2, 10);
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-request-id", requestId);

// 3) 인증 게이트: /admin 아래는 auth 쿠키가 있어야 진입 가능.
if (pathname.startsWith("/admin")) {
  const authed = request.cookies.get("auth")?.value === "1";
  if (!authed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}
```

주석의 번호(1, 3)가 위에서 본 순서도의 단계와 대응합니다. `auth` 쿠키 값이
`"1"`인지 **문자열 그대로** 비교하는 것에 주목하세요. 쿠키 유무만 보는
것이 아니라 특정 값을 요구하지만, 서명 검증 같은 진짜 확인은 아닙니다.

### `app/headers/page.tsx` — 심은 헤더 읽기

```tsx
const h = await headers();
const requestId = h.get("x-request-id") ?? "(없음)";
```

서버 컴포넌트에서 `headers()`로 proxy가 심은 요청 헤더를 읽습니다.
새로고침할 때마다 값이 바뀌고, 같은 ID가 응답 헤더에도 실려
DevTools → Network에서도 보입니다.

### `app/admin/page.tsx` — 서버에서 다시 검사

```tsx
const jar = await cookies();
if (jar.get("auth")?.value !== "1") {
  redirect("/login?from=/admin");
}
```

proxy가 이미 걸렀지만 페이지가 쿠키를 **다시** 확인합니다. proxy 검사는
UX용(빨리 로그인 화면으로 보내기), 여기가 진짜 보안 경계라는 주석이 코드에
그대로 있습니다.

### `app/actions.ts` — 쿠키 심기와 삭제

```ts
jar.set("auth", "1", {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60, // 1시간
});
```

Server Action에서 `cookies()`로 `auth=1`을 심고 `from` 파라미터로 돌아갑니다.
데모라 자격 증명 검증 없이 버튼만 누르면 로그인됩니다 — 실제 앱에서는
여기서 자격 증명을 검증하고 서명된 세션 토큰을 만들어야 합니다
(20-auth-patterns 참고).

### `app/login/page.tsx`, `app/blog/[slug]/page.tsx`

- 로그인 페이지: `searchParams`에서 `from`을 읽어 숨은 입력으로 전달합니다.
  proxy가 붙인 `from` 파라미터가 로그인 후 복귀에 쓰입니다.
- 블로그 페이지: 리라이트의 목적지. `params.slug`를 읽어 렌더링하며,
  주소창 URL이 `/old-blog/...` 그대로인지 확인해 보라고 안내합니다.

빌드 출력에는 전용 행이 표시됩니다:

```
ƒ Proxy (Middleware)
```

## 좋은 활용 사례

- A/B 테스트 리라이트, 지역 기반 라우팅
- 인증의 "빨리 돌려보내기" 게이트 (진짜 권한 검증은 서버에서)
- 요청 추적 ID 주입 (`x-request-id`)
- 단순 리다이렉트는 proxy 대신 `next.config.ts`의 `redirects`로
- CORS 헤더 설정, 프리플라이트(OPTIONS) 직접 응답
- 봇 차단, 특정 헤더 기반 즉시 응답

## DX 개선

- Edge/Node 구분 없이 하나의 파일, 하나의 런타임
- matcher로 적용 범위 선언 — 전역 미들웨어 체인 구성 불필요
- Express식 체인 구성 없이 한 함수에서 요청 전체를 조망

## 흔한 오해와 주의점

1. **proxy가 Express 미들웨어와 같다고 생각하기.** Express 미들웨어는
   라우트마다 체인으로 등록하지만, proxy는 프로젝트당 하나이고 라우트
   매칭 전에 한 번 실행됩니다. 위치와 목적이 다릅니다.
2. **proxy 검사만으로 보안이 끝났다고 생각하기.** proxy는 쿠키 유무 같은
   얕은 검사를 빠르게 하는 용도입니다. 프록시를 우회하는 경로(직접 서버
   호출, Server Function 등)까지 막으려면 페이지·액션·라우트 핸들러에서
   반드시 다시 검증해야 합니다.
3. **proxy에서 무거운 작업 하기.** DB 조회, 외부 API 호출 같은 것을
   넣으면 모든 요청(프리패치 포함)이 느려집니다. 공식 문서가 명시적으로
   경고합니다.
4. **matcher 없이 쓰기.** 정적 파일, 이미지 최적화 경로까지 proxy를
   거치게 되어 CSS/JS 로딩이 깨질 수 있습니다. 부정 매칭 패턴으로
   제외하세요.
5. **matcher를 동적으로 만들려고 하기.** matcher 값은 빌드 시 정적으로
   분석되므로 상수 문자열만 유효합니다. 변수를 넣으면 조용히 무시됩니다.

## 관련 문서

- [Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Authentication (optimistic checks)](https://nextjs.org/docs/app/guides/authentication)
- [proxy.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [NextRequest](https://nextjs.org/docs/app/api-reference/functions/next-request)
- [NextResponse](https://nextjs.org/docs/app/api-reference/functions/next-response)
