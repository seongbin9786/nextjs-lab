"use client";

import { useActionState } from "react";
import { createPost, type ActionResult } from "@/app/actions";

const initial: ActionResult = { ok: false, message: "" };

export function AddPostForm() {
  const [state, formAction, isPending] = useActionState(createPost, initial);

  return (
    <form action={formAction} className="card">
      <h3 style={{ marginTop: 0 }}>글 추가 (Server Action + updateTag)</h3>
      <label>제목</label>
      <input name="title" placeholder="예: 캐싱 모델 정리" />
      <p>
        <button type="submit" disabled={isPending}>
          {isPending ? "추가 중…" : "추가하기"}
        </button>
      </p>
      {state.message ? <p className="muted">{state.message}</p> : null}
      <p className="muted" style={{ marginBottom: 0 }}>
        제출 후 목록이 즉시 갱신됩니다. <code>updateTag</code>가 캐시를
        무효화하고 같은 응답에서 새 데이터를 렌더링하기 때문입니다.
      </p>
    </form>
  );
}
