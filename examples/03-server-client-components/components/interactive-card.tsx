"use client";

import { useState } from "react";

// 클라이언트 컴포넌트가 children을 받아 렌더링합니다.
// children은 서버에서 이미 렌더링된 결과물(HTML 직렬화 형태)로 전달되므로,
// 이 파일은 children의 내용을 몰라도 됩니다.
export function InteractiveCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>{title}</h3>
        <button type="button" onClick={() => setOpen((o) => !o)}>
          {open ? "접기" : "펼치기"}
        </button>
      </div>
      {open ? <div style={{ marginTop: 12 }}>{children}</div> : null}
    </div>
  );
}
