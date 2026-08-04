import { Suspense } from "react";
import Link from "next/link";
import { slowQuery, now } from "@/lib/slow";

export const dynamic = "force-dynamic";

async function FastCard() {
  const data = await slowQuery("fast", 500, "0.5초짜리 데이터");
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>빠른 데이터 (0.5초)</h3>
      <p style={{ margin: 0 }}>{data}</p>
      <p className="metric" style={{ marginBottom: 0 }}>{now()}</p>
    </div>
  );
}

async function MediumCard() {
  const data = await slowQuery("medium", 1500, "1.5초짜리 데이터");
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>중간 데이터 (1.5초)</h3>
      <p style={{ margin: 0 }}>{data}</p>
      <p className="metric" style={{ marginBottom: 0 }}>{now()}</p>
    </div>
  );
}

async function SlowCard() {
  const data = await slowQuery("slow", 3000, "3초짜리 데이터");
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>느린 데이터 (3초)</h3>
      <p style={{ margin: 0 }}>{data}</p>
      <p className="metric" style={{ marginBottom: 0 }}>{now()}</p>
    </div>
  );
}

export default function ProgressivePage() {
  return (
    <div className="container">
      <h1>단계별 스트리밍</h1>
      <p>
        Suspense 경계는 독립적입니다. 느린 경계가 빠른 경계를 막지
        않습니다. 아래 세 카드가 도착하는 시각을 비교해보세요.
      </p>
      <Suspense fallback={<div className="card">0.5초 대기 중…</div>}>
        <FastCard />
      </Suspense>
      <Suspense fallback={<div className="card">1.5초 대기 중…</div>}>
        <MediumCard />
      </Suspense>
      <Suspense fallback={<div className="card">3초 대기 중…</div>}>
        <SlowCard />
      </Suspense>
      <div className="note">
        블로킹 방식이었다면 가장 느린 3초에 맞춰 페이지 전체가 늦어집니다.
        스트리밍에서는 첫 바이트가 즉시, 각 카드가 준비되는 대로
        도착합니다. 즉 <strong>페이지 체감 속도 = 가장 느린 데이터가 아니라
        셸의 속도</strong>가 됩니다.
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
