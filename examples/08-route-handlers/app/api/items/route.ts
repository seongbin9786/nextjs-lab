import { NextRequest, NextResponse } from "next/server";
import { listItems, createItem } from "@/lib/store";

// app/api/items/route.ts → /api/items
// Route Handler: HTTP 메서드 이름을 그대로 export합니다.

export async function GET(request: NextRequest) {
  // 쿼리 파라미터는 request.nextUrl.searchParams로 읽습니다.
  const q = request.nextUrl.searchParams.get("q");
  let items = listItems();
  if (q) {
    items = items.filter((i) => i.name.includes(q));
  }
  return NextResponse.json({ items, count: items.length });
}

export async function POST(request: NextRequest) {
  // 요청 본문은 request.json()으로 파싱합니다.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON 본문이 아닙니다." },
      { status: 400 },
    );
  }

  const name = (body as { name?: unknown }).name;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "name(문자열)은 필수입니다." },
      { status: 422 },
    );
  }

  const item = createItem(name.trim());
  return NextResponse.json(item, { status: 201 });
}
