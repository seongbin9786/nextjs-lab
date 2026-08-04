import { NextResponse, type NextRequest } from "next/server";

// 보호할 경로: /account 아래 전부.
// proxy는 "낙관적 검사"만 합니다: 세션 쿠키가 '있는지' 보고,
// 없으면 로그인으로 돌려보냅니다. 실제 권한 판단은 서버에서 다시 합니다.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account")) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*"],
};
