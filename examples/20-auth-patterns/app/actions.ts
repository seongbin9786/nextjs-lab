"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  authenticate,
  createSessionToken,
  SESSION_COOKIE,
} from "@/lib/session";

export type LoginResult = {
  ok: boolean;
  message: string;
};

export async function login(
  _prev: LoginResult,
  formData: FormData,
): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const from = safeRedirectPath(formData.get("from"), "/account");

  const user = authenticate(email, password);
  if (!user) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const token = createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,        // JS에서 읽기 불가 → XSS 탈취 방지
    sameSite: "lax",       // CSRF 완화
    secure: process.env.NODE_ENV === "production", // HTTPS에서만
    path: "/",
    maxAge: 60 * 60,
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
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
