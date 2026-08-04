"use client";

import { useState } from "react";
import Link from "next/link";

export default function ClientPage() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>클라이언트 인터랙션</h1>
      <p>
        정적 export로 만들어도 브라우저에서 실행되는 자바스크립트는 그대로
        동작합니다. 사전 렌더링된 HTML 위에 하이드레이션됩니다.
      </p>
      <div className="card">
        <p className="metric" style={{ fontSize: "2rem", margin: "8px 0" }}>
          {count}
        </p>
        <button type="button" onClick={() => setCount((c) => c + 1)}>
          +1
        </button>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
