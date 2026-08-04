import Link from "next/link";
import { products } from "@/lib/products";

// JSON-LD: 페이지 콘텐츠의 "의미"를 검색엔진/AI에게 알려주는 구조화
// 데이터입니다. <script type="application/ld+json">으로 넣습니다.
export default function JsonLdPage() {
  const productList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        description: p.description,
        category: p.category,
        offers: {
          "@type": "Offer",
          price: p.price,
          priceCurrency: "KRW",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  };

  return (
    <div className="container">
      {/* 서버 렌더링 HTML에 그대로 직렬화됩니다. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productList) }}
      />

      <h1>JSON-LD 구조화 데이터</h1>
      <p>
        이 페이지의 소스에는 <code>{"<script type=\"application/ld+json\">"}</code>
        이 들어 있습니다. 사람이 읽는 화면과 별도로, 검색엔진이 기계적으로
        읽는 데이터를 제공합니다.
      </p>
      <div className="card">
        <pre style={{ margin: 0, overflowX: "auto" }}>
          <code>{JSON.stringify(productList, null, 2)}</code>
        </pre>
      </div>
      <h2>효과</h2>
      <ul>
        <li>
          검색 결과에 <strong>리치 스니펫</strong>(가격, 평점, 재고 등)이
          노출될 수 있습니다.
        </li>
        <li>AI 검색/요약 도구가 콘텐츠를 정확히 인용하는 데 도움이 됩니다.</li>
        <li>
          <code>schema.org</code>의 Product, Article, FAQPage, BreadcrumbList
          등 용도에 맞는 타입을 선택합니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
