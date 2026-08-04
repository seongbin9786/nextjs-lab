import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>instrumentation</h1>
      <p>
        <code>instrumentation.ts</code>는 <strong>서버가 시작될 때 한
        번</strong> 실행되는 초기화 훅과, <strong>요청 중 발생한 에러</strong>
        를 가로채는 훅을 제공합니다.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>지금 확인하기</h3>
        <p style={{ margin: "4px 0" }}>
          1. dev 서버 터미널에{" "}
          <code>[instrumentation] register() 실행됨</code> 로그가 있습니다.
        </p>
        <p style={{ margin: "4px 0" }}>
          2. <Link href="/crash">에러 페이지</Link>를 열어 서버 로그에{" "}
          <code>[instrumentation] 요청 에러</code>가 찍히는 것을 확인하세요.
        </p>
      </div>

      <h2>두 개의 훅</h2>
      <table>
        <thead>
          <tr>
            <th>훅</th>
            <th>시점</th>
            <th>쓰임새</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>register()</code></td>
            <td>서버 시작 시 1회</td>
            <td>커넥션 풀, tracing SDK 초기화</td>
          </tr>
          <tr>
            <td><code>onRequestError()</code></td>
            <td>요청 중 잡히지 않은 에러</td>
            <td>에러 리포팅, alerting</td>
          </tr>
        </tbody>
      </table>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>OpenTelemetry</strong>: Next.js는 자체 instrumentation을
          구현하지 않아도 OpenTelemetry를 자동 감지해 페이지 렌더링, 데이터
          fetching 등의 span을 만들어줍니다. <code>register()</code>에서
          OTel SDK를 초기화하면 APM 도구에 Next.js 내부 동작까지
          관찰할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
