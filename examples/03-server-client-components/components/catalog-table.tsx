"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";

// 두 비교 페이지가 공유하는 클라이언트 컴포넌트.
// 상품을 "props로 받아서" 렌더링합니다 — 데이터를 스스로 import하지 않습니다.
export function CatalogTable({ products }: { products: Product[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const shown = products.slice(0, 12);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>상품 {products.length}개 중 앞 12개</h3>
      <table style={{ margin: 0 }}>
        <thead>
          <tr>
            <th>#</th>
            <th>이름</th>
            <th>가격</th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr
              key={p.id}
              onClick={() => setSelected(selected === p.id ? null : p.id)}
              style={{
                cursor: "pointer",
                background: selected === p.id ? "var(--accent-soft)" : undefined,
              }}
            >
              <td className="metric">{p.id}</td>
              <td>
                {p.name}
                {selected === p.id ? (
                  <div className="muted" style={{ fontSize: "0.8rem" }}>
                    {p.description}
                  </div>
                ) : null}
              </td>
              <td className="metric">{p.price.toLocaleString("ko-KR")}원</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted" style={{ marginBottom: 0 }}>
        행을 클릭하면 설명이 열립니다 (클라이언트 상태).
      </p>
    </div>
  );
}
