import { headers } from "next/headers";

// 서버 컴포넌트에서는 상대 경로 fetch가 불가능해서 절대 URL이 필요합니다.
// 요청 헤더에서 host를 읽어 현재 서버의 origin을 만듭니다.
// (headers()는 요청 데이터를 읽으므로 이 함수를 쓰는 페이지는 자동으로
// 동적 렌더링됩니다.)
export async function apiUrl(path: string): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}${path}`;
}
