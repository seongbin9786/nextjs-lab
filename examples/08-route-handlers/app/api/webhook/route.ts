import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// 웹훅 패턴: 외부 시스템이 우리 서버를 호출할 때
// 서명으로 발신자를 검증합니다.
const SECRET = process.env.WEBHOOK_SECRET ?? "demo-secret";

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature");
  const raw = await request.text();

  const expected = createHmac("sha256", SECRET).update(raw).digest("hex");

  // 타이밍 공격을 막기 위해 상수 시간 비교를 사용합니다.
  const valid =
    signature !== null &&
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return NextResponse.json({ error: "서명 불일치" }, { status: 401 });
  }

  const payload = JSON.parse(raw) as { event?: string };
  // 여기서 payload에 따른 실제 처리(캐시 무효화, 알림 등)를 합니다.
  return NextResponse.json({ received: payload.event ?? "unknown" });
}
