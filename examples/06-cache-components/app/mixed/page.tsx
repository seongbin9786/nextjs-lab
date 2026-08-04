import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { cacheLife, cacheTag } from "next/cache";

async function getReport() {
  "use cache";
  cacheLife("max");
  cacheTag("report");
  return {
    title: "3분기 매출 보고서",
    summary: "캐시에 저장되는 무거운 계산 결과라고 가정합니다.",
    cachedAt: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  };
}

// 요청 시점에 실행되는 부분: connection()으로 "이건 동적 데이터"라고
// 표시하고, 호출부는 <Suspense>로 감쌉니다.
async function LiveBadge() {
  await connection();
  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  return (
    <span className="badge">
      실시간: 접속 시각 {now}
    </span>
  );
}

export default async function MixedPage() {
  const report = await getReport();

  return (
    <div className="container">
      <h1>정적 셸 + 동적 구멍</h1>
      <p>
        한 페이지 안에서 <strong>캐시되는 부분</strong>과{" "}
        <strong>요청 시 계산되는 부분</strong>이 섞여 있습니다. 이것이
        Partial Prerendering(PPR)의 완성 형태입니다.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          {report.title}{" "}
          <Suspense fallback={<span className="badge">실시간 계산 중…</span>}>
            <LiveBadge />
          </Suspense>
        </h3>
        <p>{report.summary}</p>
        <p className="metric" style={{ marginBottom: 0 }}>
          캐시 생성 시각: {report.cachedAt}
        </p>
      </div>

      <p>
        새로고침해도 <strong>캐시 생성 시각은 고정</strong>이고,{" "}
        <strong>접속 시각 배지만</strong> 바뀝니다.
      </p>

      <h2>빌드 출력 확인</h2>
      <p>
        <code>pnpm build</code> 출력에서 이 라우트는{" "}
        <code>◐ (Partial Prerendering)</code> 표시가 붙습니다. 정적 셸은
        즉시 전송되고, 동적 구멍은 Suspense 폴백 자리에 스트리밍됩니다.
      </p>
      <pre>
        <code>{`Route
┌ ○ /            (완전 정적)
├ ◐ /mixed       (정적 셸 + 동적 구멍)   ← 이 페이지
└ ƒ /dynamic     (요청 시 렌더링)`}</code>
      </pre>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
