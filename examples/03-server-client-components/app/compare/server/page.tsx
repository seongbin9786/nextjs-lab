import Link from "next/link";
import { catalog } from "@/lib/catalog";
import { CatalogTable } from "@/components/catalog-table";

// 서버 컴포넌트 페이지: 데이터를 서버에서 읽어 클라이언트 컴포넌트에
// props로 전달합니다. catalog 리터럴은 서버 번들에만 있고,
// 클라이언트 JS 번들에는 포함되지 않습니다.
export default function ServerCompositionPage() {
  return (
    <div className="container">
      <h1>
        서버 합성 <span className="badge server">서버 페이지 + 클라이언트 잎사귀</span>
      </h1>
      <p>
        이 페이지는 <strong>서버 컴포넌트</strong>입니다. 40KB 상품
        데이터를 서버에서 읽어 클라이언트 컴포넌트(<code>CatalogTable</code>)에
        넘깁니다.
      </p>
      <CatalogTable products={catalog} />
      <p>
        <Link href="/compare">← 비교 홈으로</Link>
      </p>
    </div>
  );
}
