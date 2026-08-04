import Link from "next/link";
import { apiUrl } from "@/lib/api-url";

export default async function FreshPage() {
  const url = await apiUrl("/api/now");

  // 옵션을 아무것도 주지 않으면 캐시 없음(no-store)입니다.
  // Next.js 14까지는 기본이 force-cache였고, 15부터 기본이 바뀌었습니다.
  const res = await fetch(url);
  const data = (await res.json()) as { counter: number; time: string };

  return (
    <div className="container">
      <h1>캐시 없음 (기본 동작)</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          counter: <strong className="metric">{data.counter}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          서버 시각: <span className="metric">{data.time}</span>
        </p>
      </div>
      <p>
        새로고침할 때마다 counter가 <strong>1씩 계속 증가</strong>합니다.
        매 요청 실제로 API를 호출하기 때문입니다.
      </p>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>버전별 기본값 변화</strong> — Next.js 13/14:{" "}
          <code>fetch</code> 기본이 <code>force-cache</code>(묵시적 캐싱).
          Next.js 15+: 기본이 캐시 없음. 캐싱은 항상{" "}
          <strong>명시적으로</strong> 선택해야 합니다. 이 변화는 "왜
          캐시되는지 모르겠다"는 혼란을 없애기 위한 것입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
