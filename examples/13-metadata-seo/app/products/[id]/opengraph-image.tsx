import { ImageResponse } from "next/og";
import { getProduct } from "@/lib/products";

// 이 파일은 /products/[id]의 OG 이미지를 "코드로" 그립니다.
// 빌드 시(또는 요청 시) 1200x630 PNG로 렌더링됩니다.
export const alt = "상품 OG 이미지";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProduct(id);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 42, opacity: 0.8 }}>nextjs-lab 상점</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 20 }}>
          {product ? product.name : "상품 없음"}
        </div>
        {product ? (
          <div style={{ fontSize: 48, marginTop: 30 }}>
            {product.price.toLocaleString("ko-KR")}원
          </div>
        ) : null}
      </div>
    ),
    size,
  );
}
