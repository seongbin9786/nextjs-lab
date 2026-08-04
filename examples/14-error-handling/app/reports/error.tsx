"use client";

// error.tsx는 반드시 클라이언트 컴포넌트입니다.
// 이 파일은 app/reports 와 그 하위 라우트의 에러 경계가 됩니다.
export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card" style={{ borderColor: "var(--danger)" }}>
      <h2 style={{ marginTop: 0, color: "var(--danger)" }}>
        보고서 섹션에서 오류가 났습니다
      </h2>
      <p>
        이 화면은 <code>app/reports/error.tsx</code>입니다. 홈과 내비게이션은
        그대로 살아 있고, <strong>이 섹션만</strong> 에러 UI로 교체됐습니다.
      </p>
      <p className="muted">
        메시지: {error.message}
        {error.digest ? <> / digest: <code>{error.digest}</code></> : null}
      </p>
      <p className="muted">
        (프로덕션에서는 에러 세부 내용이 사용자에게 노출되지 않고 digest만
        로그와 매칭됩니다. 지금은 개발 모드라 메시지가 보입니다.)
      </p>
      <button type="button" onClick={() => reset()}>
        reset()으로 다시 시도
      </button>
      <p className="muted" style={{ marginBottom: 0 }}>
        <code>reset()</code>은 경계 안을 다시 렌더링합니다. 원인이 사라졌다면
        (예: 일시적 데이터 문제) 그대로 복구됩니다.
      </p>
    </div>
  );
}
