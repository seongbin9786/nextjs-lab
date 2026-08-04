"use client";

import { useState } from "react";

// 마운트 시점과 클릭 횟수를 기억하는 클라이언트 컴포넌트.
// layout/template 중 누가 새로 마운트되는지 눈으로 확인하는 용도입니다.
export function MountStamp({ label }: { label: string }) {
  const [mountedAt] = useState(() => new Date().toLocaleTimeString("ko-KR"));
  const [count, setCount] = useState(0);

  return (
    <div className="card" style={{ margin: 0 }}>
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <p className="metric" style={{ margin: "4px 0" }}>
        마운트 시각: {mountedAt}
      </p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        클릭 횟수: {count}
      </button>
      <p className="muted" style={{ marginBottom: 0 }}>
        새로 마운트되면 마운트 시각과 클릭 횟수가 초기화됩니다.
      </p>
    </div>
  );
}
