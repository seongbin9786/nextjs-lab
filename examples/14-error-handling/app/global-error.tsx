"use client";

// global-error.tsx는 "최후의 방어선"입니다.
// 루트 레이아웃 자체에서 에러가 나면 일반 error.tsx조차 렌더링할 수
// 없으므로(루트 레이아웃을 경유해야 하므로), 이 파일은
// 자체 <html>/<body>를 직접 렌더링해야 합니다.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          fontFamily: "sans-serif",
          padding: 40,
          background: "#0b0d12",
          color: "#e6e9ef",
        }}
      >
        <h1>문제가 발생했습니다</h1>
        <p>앱 전체가 복구 불가능한 상태입니다. (global-error.tsx)</p>
        <p style={{ opacity: 0.7 }}>
          digest: {error.digest ?? "(개발 모드)"}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
