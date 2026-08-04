"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginResult } from "@/app/actions";

const initial: LoginResult = { ok: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "확인 중…" : "로그인"}
    </button>
  );
}

export function LoginForm({ from }: { from: string }) {
  const [state, formAction] = useActionState(login, initial);

  return (
    <form action={formAction} className="card">
      <input type="hidden" name="from" value={from} />
      <label>이메일</label>
      <input
        name="email"
        type="email"
        defaultValue="admin@example.com"
        autoComplete="email"
      />
      <label>비밀번호</label>
      <input
        name="password"
        type="password"
        defaultValue="admin123"
        autoComplete="current-password"
      />
      <p>
        <SubmitButton />
      </p>
      {state.message ? (
        <p style={{ color: "var(--danger)", margin: 0 }}>{state.message}</p>
      ) : null}
    </form>
  );
}
