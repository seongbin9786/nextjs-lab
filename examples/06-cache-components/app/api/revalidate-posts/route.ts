import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// 웹훅 패턴: Server Action 밖에서는 revalidateTag를 사용합니다.
// Next.js 16에서는 두 번째 인자(cacheLife 프로필)가 필수입니다.
export async function POST() {
  revalidateTag("posts", "max");
  return NextResponse.json({ ok: true });
}
