import Link from "next/link";
import { slowQuery, now } from "@/lib/slow";

export const dynamic = "force-dynamic";

export default async function WithLoadingPage() {
  const stats = await slowQuery(
    "stats",
    1500,
    { visitors: 12840, signups: 342 },
  );

  return (
    <div className="container">
      <h1>loading.tsx</h1>
      <p>1.5초를 기다려 도착한 실제 콘텐츠입니다.</p>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>오늘의 통계</h3>
        <p style={{ margin: "4px 0" }}>
          방문자: <strong className="metric">{stats.visitors.toLocaleString("ko-KR")}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          가입자: <strong className="metric">{stats.signups}</strong>
        </p>
        <p className="metric" style={{ marginBottom: 0 }}>렌더링 시각: {now()}</p>
      </div>
      <div className="note">
        홈에서 이 페이지로 <code>Link</code>를 클릭하면{" "}
        <code>loading.tsx</code>가 즉시 표시되어 "멈춘 느낌"을 없앱니다.
        수동으로 <code>Suspense</code>를 감싸지 않아도 됩니다.
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
