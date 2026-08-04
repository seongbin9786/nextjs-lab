import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const priority = process.env.EXAMPLE_PRIORITY ?? "(없음)";
  const mode = process.env.NODE_ENV;

  return (
    <div className="container">
      <h1>환경 변수</h1>
      <p>
        Next.js는 <code>.env</code> 파일들을 자동으로 로드합니다. 이
        페이지는 <strong>서버에서</strong> 환경 변수를 읽어 렌더링합니다.
      </p>

      <div className="card">
        <p style={{ margin: "4px 0" }}>
          NODE_ENV: <code>{mode}</code>
        </p>
        <p style={{ margin: "4px 0" }}>
          EXAMPLE_PRIORITY: <strong className="metric">{priority}</strong>
        </p>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/server">서버 전용 변수</Link>
          </h3>
          <p>브라우저 번들에 절대 포함되면 안 되는 값.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/client">NEXT_PUBLIC_ 변수</Link>
          </h3>
          <p>클라이언트에서 읽고 싶은 값. 인라인되는 방식의 함정 포함.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/runtime">런타임 변수</Link>
          </h3>
          <p>빌드 없이 컨테이너 시작 시 주입되는 값.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/priority">우선순위</Link>
          </h3>
          <p>
            <code>.env.local</code>을 만들어 우선순위를 직접 확인.
          </p>
        </div>
      </div>

      <h2>로딩 우선순위 (높은 순)</h2>
      <table>
        <thead>
          <tr>
            <th>순위</th>
            <th>파일</th>
            <th>특징</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><code>.env.local</code></td>
            <td>모든 환경. git에 커밋 금지 (test 환경 제외)</td>
          </tr>
          <tr>
            <td>2</td>
            <td>
              <code>.env.{"{development|production}"}</code>
            </td>
            <td>NODE_ENV에 따라 하나만 적용</td>
          </tr>
          <tr>
            <td>3</td>
            <td><code>.env</code></td>
            <td>모든 환경의 기본값</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        이미 셸에서 export된 변수는 .env 파일보다 우선합니다. 현재
        EXAMPLE_PRIORITY 값이 어느 파일에서 왔는지 위 카드에서 확인하세요.
      </p>
    </div>
  );
}
