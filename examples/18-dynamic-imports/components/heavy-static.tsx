"use client";

import { bigData, summarize } from "@/lib/big-data";

// /static-import 전용 무거운 컴포넌트. lib/big-data.ts 를 import합니다.
// 정적으로 import된 페이지는 이 코드(약 170KB 데이터 포함)를
// 첫 로딩 JS에 포함합니다.
export function HeavyStatic() {
  const top = [...bigData].sort((a, b) => b.value - a.value).slice(0, 20);
  const summary = summarize(bigData);
  const max = top[0]?.value ?? 1;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>무거운 차트 (정적 import)</h3>
      <p className="metric" style={{ fontSize: "0.85rem" }}>
        {summary.count.toLocaleString("ko-KR")}행 / 합계{" "}
        {summary.total.toLocaleString("ko-KR")}
      </p>
      <svg viewBox={`0 0 400 ${top.length * 14}`} style={{ width: "100%", height: "auto" }}>
        {top.map((row, i) => (
          <g key={row.id} transform={`translate(0 ${i * 14})`}>
            <rect
              x="110" y="2" width={(row.value / max) * 280} height="10" rx="3"
              fill="var(--accent)" opacity={0.5 + (row.value / max) * 0.5}
            />
            <text x="0" y="11" fontSize="8" fill="var(--muted)">{row.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
