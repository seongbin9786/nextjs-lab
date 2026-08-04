import { NextResponse } from "next/server";
import { getItem, deleteItem } from "@/lib/store";

// 동적 라우트 핸들러: app/api/items/[id]/route.ts → /api/items/:id
// params는 Next.js 15+ 에서 Promise입니다.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = getItem(Number(id));
  if (!item) {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = deleteItem(Number(id));
  if (!deleted) {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
