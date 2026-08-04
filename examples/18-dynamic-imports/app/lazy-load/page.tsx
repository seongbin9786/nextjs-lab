import Link from "next/link";
import { LazyChart } from "@/components/lazy-chart";

export default function LazyLoadPage() {
  return (
    <div className="container">
      <h1>next/dynamic</h1>
      <p>
        아래 차트는 페이지가 그려진 <strong>직후</strong> 별도 청크로
        로드됩니다. 차트 코드와 170KB 데이터가 첫 로딩 JS에는 포함되지
        않습니다.
      </p>
      <LazyChart />
      <h2>코드</h2>
      <pre>
        <code>{`const LazyChart = dynamic(
  () => import("@/components/heavy-lazy").then((m) => m.HeavyLazy),
  { loading: () => <p>차트 불러오는 중…</p> }
);`}</code>
      </pre>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>중요한 함정</strong>: 만약 이 페이지와 정적 import
          페이지가 <em>같은</em> 컴포넌트(같은 데이터)를 쓴다면, 번들러가
          그걸 공유 청크로 만들어 두 페이지 모두에서 첫 로딩에 싣습니다.
          그러면 코드 분리 효과가 사라집니다. 이 예시는 그래서 두 페이지가
          각각 독립적인 컴포넌트/데이터를 사용합니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
