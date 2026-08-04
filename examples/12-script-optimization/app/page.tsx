import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>스크립트 최적화 (next/script)</h1>
      <p>
        analytics, 챗 위젯, 광고 같은 <strong>서드파티 스크립트</strong>는
        페이지를 느리게 만드는 단골 원인입니다.{" "}
        <code>next/script</code>는 이 스크립트들을{" "}
        <strong>언제</strong> 로드할지 전략으로 제어합니다.
      </p>

      <table>
        <thead>
          <tr>
            <th>전략</th>
            <th>로드 시점</th>
            <th>용도</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>beforeInteractive</code>
            </td>
            <td>페이지 코드 실행 전 (초기 HTML에 주입)</td>
            <td>반드시 먼저 있어야 하는 스크립트 (봇 감지 등)</td>
          </tr>
          <tr>
            <td>
              <code>afterInteractive</code> (기본)
            </td>
            <td>하이드레이션 직후</td>
            <td>analytics 등 대부분의 서드파티</td>
          </tr>
          <tr>
            <td>
              <code>lazyOnload</code>
            </td>
            <td>모든 리소스 로드 후, 브라우저가 한가할 때</td>
            <td>챗 위젯 등 우선순위 낮은 스크립트</td>
          </tr>
          <tr>
            <td>
              <code>worker</code> (Partytown)
            </td>
            <td>웹 워커로 이동</td>
            <td>메인 스레드에서 완전히 분리</td>
          </tr>
        </tbody>
      </table>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/demo">전략 비교 데모</Link>
          </h3>
          <p>세 스크립트가 각각 몇 ms 뒤에 로드되는지 잽니다.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/inline">인라인 스크립트</Link>
          </h3>
          <p>
            <code>{"<Script>{`...`}</Script>"}</code> 인라인 사용법과{" "}
            <code>id</code> 규칙.
          </p>
        </div>
      </div>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>실전 팁</strong>: 구글 애널리틱스, 구글 태그 매니저 같은
          유명 서드파티는 <code>@next/third-parties</code> 패키지가 최적
          로딩을 대신 해줍니다. (이 예시는 의존성을 최소화하려고 직접{" "}
          <code>next/script</code>를 사용합니다.)
        </p>
      </div>
    </div>
  );
}
