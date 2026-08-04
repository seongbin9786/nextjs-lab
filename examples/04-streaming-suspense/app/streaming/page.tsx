import { Suspense } from "react";
import Link from "next/link";
import { now } from "@/lib/slow";
import {
  OrdersSection,
  ReviewsSection,
  SectionSkeleton,
} from "@/components/slow-section";

export const dynamic = "force-dynamic";

export default function StreamingPage() {
  return (
    <div className="container">
      <h1>스트리밍 렌더링</h1>
      <p className="metric">
        셸 렌더링 시각: {now()} — 이 문단은 데이터를 기다리지 않고 즉시
        전송됩니다.
      </p>
      <p>
        아래 두 카드는 아직 서버에서 데이터를 만드는 중입니다. 페이지
        전체가 아니라 <strong>준비된 부분부터</strong> HTML이 도착합니다.
      </p>

      {/* Suspense 경계: 안쪽이 준비될 때까지 fallback을 보여줍니다 */}
      <Suspense fallback={<SectionSkeleton label="주문 (불러오는 중)" />}>
        <OrdersSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton label="리뷰 (불러오는 중)" />}>
        <ReviewsSection />
      </Suspense>

      <div className="note">
        <p style={{ marginTop: 0 }}>
          <strong>눈으로 확인하기</strong>: 새로고침하면 스켈레톤이 먼저
          보이고, 약 1초 뒤 주문 카드, 2초 뒤 리뷰 카드가 차례대로
          나타납니다.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>curl로 확인하기</strong>: 이 페이지는 첫 바이트가 즉시
          도착합니다(TTFB 약 0.1초 이하). <code>/blocking</code>은 약
          2초였습니다. <code>scripts/bench.sh</code>로 재현할 수 있습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
