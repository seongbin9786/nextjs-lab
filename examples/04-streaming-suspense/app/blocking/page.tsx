import Link from "next/link";
import { slowQuery, now } from "@/lib/slow";

// 데모를 위해 매 요청마다 서버에서 렌더링합니다.
export const dynamic = "force-dynamic";

export default async function BlockingPage() {
  const started = Date.now();

  // 느린 쿼리 2개를 순서대로 기다린 "다음"에야 HTML이 만들어집니다.
  // 사용자는 이 시간 동안 빈 화면을 봅니다.
  const orders = await slowQuery("orders", 1000, [
    { id: "A-100", item: "키보드" },
    { id: "A-101", item: "마우스" },
  ]);
  const reviews = await slowQuery("reviews", 1000, [
    { id: "R-1", text: "배송이 빨라요" },
    { id: "R-2", text: "마감 좋습니다" },
  ]);

  const elapsed = Date.now() - started;

  return (
    <div className="container">
      <h1>블로킹 렌더링</h1>
      <p>
        서버가 데이터를 전부 모을 때까지 HTML 전송이{" "}
        <strong>지연되었습니다.</strong>
      </p>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>결과</h3>
        <ul>
          <li>주문 {orders.length}건</li>
          <li>리뷰 {reviews.length}건</li>
        </ul>
        <p className="metric">
          서버 렌더링 소요: {elapsed}ms (렌더링 시각 {now()})
        </p>
      </div>
      <div className="note">
        curl로 측정하면 이 페이지의 TTFB(첫 바이트 도착)는 약 2초입니다.
        HTML의 첫 한 글자도 그 전에는 도착하지 않습니다.{" "}
        <Link href="/streaming">스트리밍 페이지</Link>와 비교해보세요.
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
