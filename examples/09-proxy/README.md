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
| 모든 응답 | `x-powered-by-proxy` 헤더 추가 (DevTools에서 확인) |

## 핵심 개념

```ts
// proxy.ts (프로젝트 루트)
export function proxy(request: NextRequest) {
  if (request.cookies.get("auth")?.value !== "1") {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

빌드 출력에 전용 행이 표시됩니다:

```
ƒ Proxy (Middleware)
```

## middleware에서 바뀐 점 (Next.js 16)

| 항목 | 이전 | Next 16 |
| --- | --- | --- |
| 파일명 | `middleware.ts` | **`proxy.ts`** |
| export | `middleware` | `proxy` (default export도 가능) |
| 상태 | — | `middleware.ts`는 deprecated (동작은 함) |

이름이 바뀐 이유: 이 코드가 **네트워크 경계**에서 일한다는 역할을
드러내기 위해서입니다.

## 정량 비교: proxy 게이트 vs 페이지에서만 검사

| 방식 | 비로그인 사용자가 `/admin` 접근 시 |
| --- | --- |
| proxy 게이트 있음 | 렌더링 시작 전에 리다이렉트 — **페이지 코드 실행 0** |
| 페이지에서만 검사 | 페이지 전체 렌더링 시작 후 redirect (계산 일부 낭비) |

proxy는 빠르지만 **낙관적 검사**입니다. `/admin` 페이지는 쿠키 서명까지
다시 검증합니다(이중 방어).

## 좋은 활용 사례

- A/B 테스트 리라이트, 지역 기반 라우팅
- 인증의 "빨리 돌려보내기" 게이트 (진짜 권한 검증은 서버에서)
- 요청 추적 ID 주입 (`x-request-id`)
- 단순 리다이렉트는 proxy 대신 `next.config.ts`의 `redirects`로

## DX 개선

- Edge/Node 구분 없이 하나의 파일, 하나의 런타임
- matcher로 적용 범위 선언 — 전역 미들웨어 체인 구성 불필요

## 관련 문서

- [Proxy](https://nextjs.org/docs/app/getting-started/proxy)
- [Authentication (optimistic checks)](https://nextjs.org/docs/app/guides/authentication)
