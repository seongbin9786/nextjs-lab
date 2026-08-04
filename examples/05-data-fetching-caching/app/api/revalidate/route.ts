import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// 웹훅/관리자 API 패턴: 데이터가 바뀌면 태그로 캐시를 무효화합니다.
export async function POST() {
  // Next.js 16부터는 두 번째 인자로 cacheLife 프로필을 반드시 넘겨야 합니다.
  // 'max'는 stale-while-revalidate 방식으로, 캐시를 즉시 무효화하되
  // 다음 요청에서 백그라운드 재검증을 허용합니다.
  revalidateTag("now-data", "max");

  // 경로 기준으로 무효화할 수도 있습니다.
  revalidatePath("/isr");

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
