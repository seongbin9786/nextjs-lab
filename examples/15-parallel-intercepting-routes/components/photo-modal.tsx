"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// 모달 본체. 닫으면 뒤로 가기로 갤러리로 복귀합니다.
export function PhotoModal({ id }: { id: string }) {
  const router = useRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)",
          borderRadius: 14,
          padding: 20,
          maxWidth: 480,
          width: "calc(100% - 40px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/photos/${id}.svg`}
          alt={`사진 ${id}`}
          style={{ width: "100%", borderRadius: 10, display: "block" }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <strong>사진 #{id}</strong>
          <button type="button" onClick={close}>
            닫기 (Esc)
          </button>
        </div>
        <p className="muted" style={{ marginBottom: 0, fontSize: "0.85rem" }}>
          이 모달은 <code>@modal/(.)photo/[id]</code>가 렌더링합니다. 주소는{" "}
          <code>/photo/{id}</code> 이지만 전체 페이지는 로드되지 않았습니다.
        </p>
      </div>
    </div>
  );
}
