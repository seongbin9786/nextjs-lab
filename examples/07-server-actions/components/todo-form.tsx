"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createTodo, type TodoActionResult } from "@/app/actions";

const initial: TodoActionResult = { ok: false, message: "" };

// useFormStatus는 폼 안의 자식 컴포넌트에서 호출해야 합니다.
// 그래서 제출 버튼을 별도 컴포넌트로 분리했습니다.
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "추가하는 중…" : "추가"}
    </button>
  );
}

export function TodoForm() {
  const [state, formAction] = useActionState(createTodo, initial);

  return (
    <form action={formAction} className="card">
      <h3 style={{ marginTop: 0 }}>새 할 일</h3>
      <label>내용</label>
      <input name="text" placeholder="예: Server Action 연습" autoFocus />
      <p>
        <SubmitButton />
      </p>
      {state.message ? (
        <p
          style={{
            color: state.ok ? "var(--success)" : "var(--danger)",
            margin: 0,
          }}
        >
          {state.message}
        </p>
      ) : null}
      <p className="muted" style={{ marginBottom: 0 }}>
        서버에서 800ms를 기다리므로 "추가하는 중…"이 충분히 보입니다. 빈
        값을 제출하면 서버 검증 메시지가 뜹니다.
      </p>
    </form>
  );
}
