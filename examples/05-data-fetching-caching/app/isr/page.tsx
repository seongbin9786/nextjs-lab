import Link from "next/link";
import { getStats } from "@/lib/stats";

// 풀 라우트 캐시(ISR): 이 페이지의 HTML 자체가 캐시되고
// 10초마다 백그라운드에서 다시 생성됩니다.
export const revalidate = 10;

export default function IsrPage() {
  const stats = getStats();

  return (
    <div className="container">
      <h1>ISR — 증분 정적 재생성</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          누적 방문자:{" "}
          <strong className="metric">
            {stats.visitors.toLocaleString("ko-KR")}
          </strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          HTML 생성 시각: <span className="metric">{stats.generatedAt}</span>
        </p>
      </div>
      <ol>
        <li>
          새로고침을 반복해보세요. <strong>생성 시각이 10초 동안 고정</strong>
          입니다. HTML이 캐시에서 나옵니다.
        </li>
        <li>
          10초가 지나면 다음 방문자는 <strong>여전히 기존 HTML을 즉시</strong>{" "}
          받고, 그 사이 새 HTML이 생성됩니다.
        </li>
        <li>
          <code>/cached</code>의 버튼이나 <code>curl -X POST</code>로{" "}
          <code>/api/revalidate</code>를 호출하면(revalidatePath) 10초를
          기다리지 않고 다음 방문 때 재생성됩니다.
        </li>
      </ol>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>ISR의 가치</strong>: 정적 호스팅의 속도(미리 만든 HTML)와
          동적 렌더링의 최신성(주기적 재생성)을 결합합니다. 트래픽이 몰려도
          서버 계산은 10초에 한 번뿐입니다. 뉴스, 상품 목록, 랭킹처럼
          "초단위 최신성은 필요 없지만 1시간씩 묵으면 곤란한" 콘텐츠에
          적합합니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
