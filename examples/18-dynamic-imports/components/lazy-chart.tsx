"use client";

import dynamic from "next/dynamic";

// next/dynamic은 클라이언트 컴포넌트 안에서 사용합니다.
// HeavyLazy(와 그 데이터)는 별도 청크로 분리되어,
// 이 컴포넌트가 실제로 렌더링될 때만 다운로드됩니다.
export const LazyChart = dynamic(
  () => import("@/components/heavy-lazy").then((m) => m.HeavyLazy),
  {
    loading: () => (
      <div className="card" aria-busy="true">
        <p style={{ margin: 0 }}>차트 청크를 불러오는 중…</p>
      </div>
    ),
  },
);
