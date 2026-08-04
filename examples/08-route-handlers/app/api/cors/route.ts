import { NextResponse } from "next/server";

// CORS: 다른 origin의 브라우저가 이 API를 호출할 수 있게 허용하는 헤더.
// 허용할 origin은 반드시 명시적으로 관리하세요. (와일드카드 + 인증 조합 금지)
const ALLOWED_ORIGIN = "https://example.com";

function corsHeaders(origin: string | null) {
  const allowed = origin === ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? ALLOWED_ORIGIN : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

// 프리플라이트 요청(OPTIONS) 처리.
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  return NextResponse.json(
    {
      message: "CORS 예시 응답",
      yourOrigin: origin ?? "(없음 — 같은 origin 또는 비브라우저 요청)",
      allowedOrigin: ALLOWED_ORIGIN,
    },
    { headers: corsHeaders(origin) },
  );
}
