import Link from "next/link";
import { apiUrl } from "@/lib/api-url";

export default async function TimeBasedPage() {
  const url = await apiUrl("/api/now");

  // 10초 단위 시간 기반 재검증입니다.
  // 만료 후 첫 요청은 "기존 값"을 즉시 돌려주고, 백그라운드에서 새 값을
  // 만들어 다음 요청부터 반영합니다(stale-while-revalidate).
  const res = await fetch(url, { next: { revalidate: 10 } });
  const data = (await res.json()) as { counter: number; time: string };

  return (
    <div className="container">
      <h1>시간 기반 재검증 (10초)</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          counter: <strong className="metric">{data.counter}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          서버 시각: <span className="metric">{data.time}</span>
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          새로고침한 시각:{" "}
          <TimeNow />
        </p>
      </div>
      <ol>
        <li>10초 안에 여러 번 새로고침 → counter가 그대로입니다.</li>
        <li>10초를 넘기고 새로고침 → 다음 새로고침부터 새 값이 보입니다.</li>
      </ol>
      <div className="note">
        <p style={{ margin: 0 }}>
          <code>{"fetch(url, { next: { revalidate: 10 } })"}</code>는{" "}
          <code>{"fetch(url, { cache: \"force-cache\", next: { revalidate: 10 } })"}</code>
          와 같습니다. revalidate를 주면 캐시가 자동으로 켜집니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}

function TimeNow() {
  return <span className="metric">{new Date().toLocaleTimeString("ko-KR", { hour12: false })}</span>;
}
