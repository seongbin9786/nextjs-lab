import Link from "next/link";

// 중첩 레이아웃: /dashboard 아래 모든 페이지가 이 레이아웃을 공유합니다.
// /dashboard 와 /dashboard/settings 사이를 이동해도 이 컴포넌트는
// 다시 렌더링되지 않습니다. (서브 내비게이션의 활성 상태만 바뀌는 것 제외)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24 }}>
      <aside className="card" style={{ margin: 0 }}>
        <h3 style={{ marginTop: 0 }}>대시보드</h3>
        <p style={{ display: "grid", gap: 6 }}>
          <Link href="/dashboard">개요</Link>
          <Link href="/dashboard/settings">설정</Link>
        </p>
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          이 사이드바는 <code>dashboard/layout.tsx</code>가 렌더링합니다.
          탭을 오가도 DOM이 유지되는지 DevTools로 확인해보세요.
        </p>
      </aside>
      <section>{children}</section>
    </div>
  );
}
