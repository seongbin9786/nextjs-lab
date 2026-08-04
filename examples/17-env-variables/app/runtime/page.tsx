import Link from "next/link";

// 런타임 환경 변수를 매 요청 읽으려면 동적 렌더링이어야 합니다.
export const dynamic = "force-dynamic";

export default function RuntimeEnvPage() {
  // 셸에서 export된 값은 매 요청 process.env에서 읽힙니다.
  // 이 예시에서는 아무것도 주입하지 않았으므로 "(주입 안 됨)"입니다.
  const runtimeValue = process.env.DEPLOY_REGION ?? "(주입 안 됨)";

  return (
    <div className="container">
      <h1>런타임 변수</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          DEPLOY_REGION: <strong className="metric">{runtimeValue}</strong>
        </p>
      </div>
      <p>지금 서버를 이렇게 띄우면 값이 나타납니다.</p>
      <pre>
        <code>{`DEPLOY_REGION=ap-northeast-2 pnpm dev`}</code>
      </pre>
      <h2>인라인 변수와의 차이</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>NEXT_PUBLIC_ (빌드 시)</th>
            <th>런타임 변수</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>읽는 곳</td>
            <td>빌드된 번들(클라이언트 포함)</td>
            <td>서버 프로세스</td>
          </tr>
          <tr>
            <td>변경하려면</td>
            <td>다시 빌드 필요</td>
            <td>프로세스 재시작만</td>
          </tr>
          <tr>
            <td>쓰임새</td>
            <td>공개돼도 되는 고정 값</td>
            <td>배포 환경별 비밀 값, 컨테이너 주입 값</td>
          </tr>
        </tbody>
      </table>
      <p className="muted">
        같은 Docker 이미지를 환경(dev/staging/prod)별로 다른 변수로 띄우는
        패턴이 여기에 해당합니다.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
