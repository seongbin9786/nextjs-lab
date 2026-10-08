"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const from = safeRedirectPath(formData.get("from"), "/admin");

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

// from은 쿼리스트링에서 그대로 넘어오는 사용자 입력입니다. 검사 없이
// redirect(from) 하면 /login?from=https://evil.example 로그인 후 외부
// 사이트로 보내는 open redirect가 됩니다. 같은 사이트의 경로만 허용합니다.
function safeRedirectPath(value: FormDataEntryValue | null, fallback: string) {
  const path = typeof value === "string" ? value : "";
  // "//host"와 "/\host"는 브라우저가 외부 주소로 해석합니다.
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  return path;
}

export async function logout() {
  const jar = await cookies();
  jar.delete("auth");
  redirect("/");
}
