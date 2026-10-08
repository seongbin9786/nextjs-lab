"use client";

import { useEffect, useState } from "react";

// 마운트 시점과 클릭 횟수를 기억하는 클라이언트 컴포넌트.
// layout/template 중 누가 새로 마운트되는지 눈으로 확인하는 용도입니다.
export function MountStamp({ label }: { label: string }) {
  const [mountedAt, setMountedAt] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // 시각은 마운트 후에 기록합니다. useState 초기화 함수에서 시각을 만들면
  // 서버 HTML(정적 라우트라 빌드 시각)과 클라이언트 값이 달라 hydration
  // 불일치가 납니다.
  useEffect(() => {
    setMountedAt(new Date().toLocaleTimeString("ko-KR"));
  }, []);

  return (
    <div className="card" style={{ margin: 0 }}>
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <p className="metric" style={{ margin: "4px 0" }}>
        마운트 시각: {mountedAt ?? "—"}
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
