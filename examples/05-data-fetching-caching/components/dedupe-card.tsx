import { apiUrl } from "@/lib/api-url";

// 페이지와 이 컴포넌트가 "같은 URL, 같은 옵션"으로 fetch합니다.
// 요청 메모이제이션이 작동하면 네트워크 요청은 한 번만 나갑니다.
export async function DedupeCard() {
  const url = await apiUrl("/api/now");
  const res = await fetch(url);
  const data = (await res.json()) as { counter: number; time: string };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>자식 컴포넌트의 fetch</h3>
      <p style={{ margin: "4px 0" }}>
        counter: <strong className="metric">{data.counter}</strong>
      </p>
      <p className="metric" style={{ margin: 0, fontSize: "0.85rem" }}>
        {data.time}
      </p>
    </div>
  );
}
