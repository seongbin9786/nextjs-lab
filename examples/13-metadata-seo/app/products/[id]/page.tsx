import type { Metadata } from "next";
import Link from "next/link";
import { getProduct } from "@/lib/products";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return [{ id: "keyboard" }, { id: "mouse" }];
}

// 동적 메타데이터: params를 받아 페이지마다 다른 메타태그를 만듭니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "상품 없음" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      // 같은 폴더의 opengraph-image.tsx가 OG 이미지를 생성합니다.
      // images를 생략하면 파일 규칙이 자동으로 쓰입니다.
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>products</span>{" "}
        <span>/</span> <span>{product.id}</span>
      </nav>
      <h1>{product.name}</h1>
      <p className="metric" style={{ fontSize: "1.3rem" }}>
        {product.price.toLocaleString("ko-KR")}원
      </p>
      <p>{product.description}</p>
      <div className="note">
        <p style={{ margin: 0 }}>
          지금 <strong>페이지 소스 보기</strong>를 해보세요.{" "}
          <code>&lt;title&gt;</code>, <code>meta[name=description]</code>,{" "}
          <code>og:title</code> 등이 이 상품 값으로 채워져 있습니다. SNS에
          링크를 붙여넣으면 OG 이미지가 함께 보입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
