import Link from "next/link";
import { apiUrl } from "@/lib/api-url";
import { DedupeCard } from "@/components/dedupe-card";

export default async function DedupePage() {
  const url = await apiUrl("/api/now");

  // 자식 컴포넌트(DedupeCard)와 완전히 같은 URL을 fetch합니다.
  const res = await fetch(url);
  const data = (await res.json()) as { counter: number; time: string };

  return (
    <div className="container">
      <h1>요청 메모이제이션</h1>
      <p>
        이 페이지와 자식 컴포넌트가 <strong>같은 URL</strong>로 fetch합니다.
        Next.js는 한 번의 렌더 패스 안에서 같은 요청을 중복으로 보내지
        않습니다.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>페이지의 fetch</h3>
          <p style={{ margin: "4px 0" }}>
            counter: <strong className="metric">{data.counter}</strong>
          </p>
          <p className="metric" style={{ margin: 0, fontSize: "0.85rem" }}>
            {data.time}
          </p>
        </div>
        <DedupeCard />
      </div>
      <div className="note">
        <p style={{ margin: 0 }}>
          두 카드의 counter가 <strong>같으면</strong> 메모이제이션이
          작동한 것입니다(요청은 1번). 다르면 2번 요청된 것입니다. 새로고침할
          때마다 counter가 정확히 <strong>1씩</strong>만 증가하는 것도
          확인해보세요. 메모이제이션이 없다면 2씩 증가해야 합니다.
        </p>
      </div>
      <h2>적용 조건</h2>
      <ul>
        <li>같은 URL + 같은 옵션(GET 요청)</li>
        <li>같은 렌더 패스(요청) 안에서 — 사용자 간, 요청 간 공유는 아님</li>
        <li>
          <code>cache: "no-store"</code>여도 메모이제이션은 적용됩니다. 캐시
          계층과 별개입니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
