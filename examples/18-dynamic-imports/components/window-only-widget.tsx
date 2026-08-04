"use client";

// 렌더링 즉시 window를 사용하는 컴포넌트.
// 서버에서는 window가 없어서 SSR 시 오류가 납니다.
export function WindowOnlyWidget() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>브라우저 전용 위젯</h3>
      <p className="metric" style={{ margin: 0 }}>
        현재 창 크기: {width} × {height}
      </p>
    </div>
  );
}
