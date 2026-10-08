import { NextResponse, type NextRequest } from "next/server";

// Next.js 16에서 middleware.ts는 proxy.ts로 이름이 바뀌었습니다.
// (middleware.ts도 아직 동작하지만 deprecated입니다.)
// 모든 요청이 페이지에 도달하기 전에 이 함수를 거칩니다.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1) 요청 헤더에 ID를 심어서 페이지/라우트 핸들러에서 읽게 합니다.
  const requestId = Math.random().toString(36).slice(2, 10);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // 2) 단순 리다이렉트: /legacy → 홈
  //    (응답 헤더에는 요청 ID만 붙입니다. requestHeaders를 그대로 넘기면
  //     cookie 등 요청 헤더 전체가 응답 헤더로 되돌아갑니다.)
  if (pathname === "/legacy") {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.headers.set("x-request-id", requestId);
    return response;
  }

  // 3) 인증 게이트: /admin 아래는 auth 쿠키가 있어야 진입 가능.
  //    (낙관적 검사입니다. 쿠키 유무만 보고, 실제 권한 검증은
  //     서버 코드에서 다시 해야 합니다.)
  if (pathname.startsWith("/admin")) {
    const authed = request.cookies.get("auth")?.value === "1";
    if (!authed) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4) 리라이트: /old-blog/:slug → /blog/:slug
  //    URL은 그대로 두고 내부적으로 다른 라우트를 렌더링합니다.
  if (pathname.startsWith("/old-blog/")) {
    const slug = pathname.replace("/old-blog/", "");
    const target = new URL(`/blog/${slug}`, request.url);
    return NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  }

  // 5) 응답 헤더 추가: 브라우저 DevTools에서 확인할 수 있습니다.
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);
  response.headers.set("x-powered-by-proxy", "nextjs-lab");
  return response;
}

// 어떤 경로에서 proxy를 실행할지 지정합니다.
// 정적 파일(_next/*)은 건너뜁니다.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
