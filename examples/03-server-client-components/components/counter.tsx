"use client";

import { useState } from "react";

// 브라우저에서 실행되는 클라이언트 컴포넌트.
// useState, onClick 같은 상호작용은 여기서만 가능합니다.
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        Counter <span className="badge client">클라이언트 컴포넌트</span>
      </h3>
      <p className="metric" style={{ fontSize: "2rem", margin: "8px 0" }}>
        {count}
      </p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <p className="muted">
        파일 첫 줄의 <code>"use client"</code>가 이 파일을 클라이언트 번들에
        포함시킵니다. 이 파일이 import하는 모든 것(여기선 useState)도 함께
        클라이언트로 갑니다.
      </p>
    </div>
  );
}
