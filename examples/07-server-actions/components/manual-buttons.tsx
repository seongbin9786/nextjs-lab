"use client";

import { useState, useTransition } from "react";
import { likePhoto } from "@/app/actions";

export function ManualButtons() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<number | null>(null);

  function onLike() {
    startTransition(async () => {
      const next = await likePhoto();
      setResult(next);
    });
  }

  return (
    <div className="card">
      <button type="button" onClick={onLike} disabled={isPending}>
        {isPending ? "호출 중…" : "likePhoto() 직접 호출"}
      </button>
      {result !== null ? (
        <p style={{ margin: "10px 0 0" }}>
          서버가 돌려준 좋아요 수: <strong className="metric">{result}</strong>
        </p>
      ) : null}
    </div>
  );
}
