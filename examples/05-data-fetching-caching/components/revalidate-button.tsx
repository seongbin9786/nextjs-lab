"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// 캐시 무효화 API를 호출한 뒤 현재 라우트의 데이터를 갱신합니다.
export function RevalidateButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function onClick() {
    startTransition(async () => {
      const res = await fetch("/api/revalidate", { method: "POST" });
      const data = (await res.json()) as { at: string };
      setMessage(`무효화 완료: ${new Date(data.at).toLocaleTimeString("ko-KR")}`);
      // 라우터 캐시를 갱신하고 서버에서 다시 렌더링합니다.
      router.refresh();
    });
  }

  return (
    <div>
      <button type="button" onClick={onClick} disabled={isPending}>
        {isPending ? "무효화 중…" : "캐시 무효화 (revalidateTag)"}
      </button>
      {message ? <p className="muted">{message}</p> : null}
    </div>
  );
}
