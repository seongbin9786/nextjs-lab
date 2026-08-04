"use client";

import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { CatalogTable } from "@/components/catalog-table";

// 전부 클라이언트: 페이지 자체가 클라이언트 컴포넌트라
// 40KB catalog 리터럴이 브라우저 JS 번들에 그대로 포함됩니다.
// 화면에 보이는 결과는 /compare/server 와 동일합니다.
export default function AllClientPage() {
  return (
    <div className="container">
      <h1>
        전부 클라이언트 <span className="badge client">use client 페이지</span>
      </h1>
      <p>
        이 페이지는 <strong>전체가 클라이언트 컴포넌트</strong>입니다.
        같은 상품 데이터를 직접 import하므로 40KB 리터럴이 브라우저 JS
        번들에 포함됩니다.
      </p>
      <CatalogTable products={catalog} />
      <p>
        <Link href="/compare">← 비교 홈으로</Link>
      </p>
    </div>
  );
}
