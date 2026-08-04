"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const from = String(formData.get("from") ?? "/admin");

  // 실제 앱: 자격 증명 검증 → 세션 생성. 여기서는 쿠키만 심습니다.
  const jar = await cookies();
  jar.set("auth", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1시간
  });

  redirect(from);
}

export async function logout() {
  const jar = await cookies();
  jar.delete("auth");
  redirect("/");
}
