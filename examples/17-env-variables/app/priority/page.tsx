import Link from "next/link";

export const dynamic = "force-dynamic";

export default function PriorityPage() {
  const priority = process.env.EXAMPLE_PRIORITY ?? "(없음)";

  return (
    <div className="container">
      <h1>우선순위 확인</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          현재 EXAMPLE_PRIORITY:{" "}
          <strong className="metric">{priority}</strong>
        </p>
      </div>
      <p>이 값은 다음 순서로 가장 먼저 정의된 곳에서 옵니다.</p>
      <ol>
        <li>
          셸에서 이미 export된 값 (가장 우선)
        </li>
        <li>
          <code>.env.local</code>
        </li>
        <li>
          <code>.env.development</code> 또는 <code>.env.production</code>{" "}
          (NODE_ENV에 따라)
        </li>
        <li>
          <code>.env</code>
        </li>
      </ol>
      <h2>직접 실험</h2>
      <pre>
        <code>{`# 1) .env.local 을 만듭니다
cp .env.example .env.local

# 2) dev 서버를 재시작하지 않아도, 페이지를 새로고침하면
#    EXAMPLE_PRIORITY 가 local(.env.local) 로 바뀝니다.`}</code>
      </pre>
      <div className="note">
        <p style={{ margin: 0 }}>
          dev 서버는 파일 변경을 감지해 .env를 다시 읽지만,{" "}
          <strong>이미 실행 중인 서버의 process.env에 직접 export한 값</strong>
          이 있다면 그게 항상 이깁니다. 값이 "안 바뀌는" 것 같을 때는 셸
          환경을 의심하세요.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
