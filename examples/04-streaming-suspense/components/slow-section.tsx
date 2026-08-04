import { slowQuery, now } from "@/lib/slow";

// 서버 컴포넌트도 비동기로 데이터를 기다릴 수 있습니다.
// 이 컴포넌트가 <Suspense> 안에 있으면, 기다리는 동안 폴백이 보여지고
// 준비가 끝나면 그 부분만 HTML로 스트리밍됩니다.
export async function OrdersSection() {
  const orders = await slowQuery(
    "orders",
    1000,
    [
      { id: "A-100", item: "키보드" },
      { id: "A-101", item: "마우스" },
    ],
  );

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        주문 <span className="badge static">1초 뒤에 스트리밍됨</span>
      </h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            <code>{o.id}</code> — {o.item}
          </li>
        ))}
      </ul>
      <p className="metric" style={{ marginBottom: 0 }}>
        도착 시각: {now()}
      </p>
    </div>
  );
}

export async function ReviewsSection() {
  const reviews = await slowQuery(
    "reviews",
    2000,
    [
      { id: "R-1", text: "배송이 빨라요" },
      { id: "R-2", text: "마감 좋습니다" },
    ],
  );

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        리뷰 <span className="badge static">2초 뒤에 스트리밍됨</span>
      </h3>
      <ul>
        {reviews.map((r) => (
          <li key={r.id}>{r.text}</li>
        ))}
      </ul>
      <p className="metric" style={{ marginBottom: 0 }}>
        도착 시각: {now()}
      </p>
    </div>
  );
}

export function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="card" aria-busy="true">
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <div
        style={{
          height: 72,
          borderRadius: 8,
          background:
            "linear-gradient(90deg, var(--code-bg) 25%, var(--border) 50%, var(--code-bg) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.2s infinite",
        }}
      />
      <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
    </div>
  );
}
