// loading.tsx는 같은 폴더의 page.tsx를 위한 자동 Suspense 경계입니다.
// 1) 서버 스트리밍 중 page가 준비되기 전
// 2) 클라이언트 내비게이션(Link 클릭)으로 이 라우트로 오는 중
// 에 이 파일이 즉시 표시됩니다.
export default function Loading() {
  return (
    <div className="container">
      <h1>불러오는 중…</h1>
      <div className="card" aria-busy="true">
        <div
          style={{
            height: 120,
            borderRadius: 8,
            background:
              "linear-gradient(90deg, var(--code-bg) 25%, var(--border) 50%, var(--code-bg) 75%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.2s infinite",
          }}
        />
        <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
      </div>
      <p className="muted">
        이 화면은 <code>app/with-loading/loading.tsx</code>입니다. Suspense를
        직접 작성하지 않아도 파일 하나로 로딩 UI를 만들 수 있습니다.
      </p>
    </div>
  );
}
