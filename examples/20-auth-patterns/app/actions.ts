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
  const from = String(formData.get("from") ?? "/account");

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

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
