import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/lib/data";

// Next.js 15+ 에서 params는 Promise입니다. 반드시 await 해야 합니다.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  // 데이터가 없으면 404 페이지(app/not-found.tsx)를 렌더링합니다.
  // throw할 필요 없이 선언적으로 "없음"을 표현합니다.
  if (!product) {
    notFound();
  }

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>products</span>{" "}
        <span>/</span> <span>{product.id}</span>
      </nav>
      <h1>{product.name}</h1>
      <p className="metric">
        {product.price.toLocaleString("ko-KR")}원
      </p>
      <p>{product.description}</p>
      <div className="note">
        <p style={{ margin: 0 }}>
          이 페이지가 받은 파라미터: <code>id = "{product.id}"</code>
        </p>
      </div>
      <p>
        <Link href="/">← 돌아가기</Link>
      </p>
    </div>
  );
}

// generateMetadata도 params를 받아 동적으로 만듭니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  return {
    title: product ? `${product.name} - 상품 상세` : "상품 없음",
  };
}

// 참고: 여기도 generateStaticParams를 추가하면 상품 페이지를 SSG로 만들 수
// 있습니다. 일부러 빼 두어 "요청 시 렌더링되는 동적 라우트"와 빌드 시
// 만들어지는 라우트의 차이를 2번(블로그)과 비교할 수 있게 했습니다.
