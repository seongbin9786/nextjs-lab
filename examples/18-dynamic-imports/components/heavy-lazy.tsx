"use client";

import { bigData, summarize } from "@/lib/big-data-2";

// /lazy-load 전용 무거운 컴포넌트. lib/big-data-2.ts 를 import합니다.
// (static 쪽과 "다른" 데이터 파일을 써야 bundler가 두 페이지를
//  공유 청크로 묶지 않고, 코드 분리가 숫자로 드러납니다.)
export function HeavyLazy() {
  const top = [...bigData].sort((a, b) => b.value - a.value).slice(0, 20);
  const summary = summarize(bigData);
  const max = top[0]?.value ?? 1;

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>무거운 차트 (지연 로딩)</h3>
      <p className="metric" style={{ fontSize: "0.85rem" }}>
        {summary.count.toLocaleString("ko-KR")}행 / 합계{" "}
        {summary.total.toLocaleString("ko-KR")}
      </p>
      <svg viewBox={`0 0 400 ${top.length * 14}`} style={{ width: "100%", height: "auto" }}>
        {top.map((row, i) => (
          <g key={row.id} transform={`translate(0 ${i * 14})`}>
            <rect
              x="110" y="2" width={(row.value / max) * 280} height="10" rx="3"
              fill="var(--success)" opacity={0.5 + (row.value / max) * 0.5}
            />
            <text x="0" y="11" fontSize="8" fill="var(--muted)">{row.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
