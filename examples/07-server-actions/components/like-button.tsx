"use client";

import { useOptimistic, useTransition } from "react";
import { likePhoto } from "@/app/actions";

export function LikeButton({ initial }: { initial: number }) {
  // 서버 응답이 오기 전에 미리 표시할 "낙관적" 값.
  // 액션이 끝나면 실제 값으로 자동 교체됩니다.
  const [optimistic, addOptimistic] = useOptimistic(
    initial,
    (state, delta: number) => state + delta,
  );
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      addOptimistic(1);      // 즉시 +1 표시
      await likePhoto();     // 서버 액션 실행 (600ms)
    });
  }

  return (
    <div className="card" style={{ textAlign: "center" }}>
      <p className="metric" style={{ fontSize: "2.4rem", margin: "8px 0" }}>
        ♥ {optimistic}
      </p>
      <button type="button" onClick={onClick} disabled={isPending}>
        좋아요
      </button>
      <p className="muted" style={{ marginBottom: 0 }}>
        누르는 순간 숫자가 즉시 오르고, 약 0.6초 뒤 서버 값과 일치하게
        됩니다. 서버가 느려도 체감 지연이 없습니다.
      </p>
    </div>
  );
}
