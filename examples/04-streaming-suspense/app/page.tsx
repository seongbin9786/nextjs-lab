import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>스트리밍과 Suspense</h1>
      <p>
        서버가 HTML을 <strong>한 번에 다 만들어서 보내는 방식</strong>과,{" "}
        <strong>준비된 부분부터 흘려보내는 방식(스트리밍)</strong>의 차이를
        직접 확인하는 예시입니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/blocking">블로킹 렌더링</Link>
          </h3>
          <p>
            느린 데이터 2개를 전부 기다린 뒤에야 페이지가 도착합니다.
            첫 바이트까지 약 <strong className="metric">2초</strong>.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/streaming">스트리밍 렌더링</Link>
          </h3>
          <p>
            셸(틀)은 즉시 도착하고, 느린 부분은 Suspense 폴백으로 표시되다
            준비되면 스트리밍됩니다. 첫 바이트까지{" "}
            <strong className="metric">0.1초 이하</strong>.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/with-loading">loading.tsx</Link>
          </h3>
          <p>
            <code>loading.tsx</code> 파일 하나만으로 Suspense 경계를 만드는
            방법. 클라이언트 내비게이션 중 즉시 스켈레톤을 보여줍니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/progressive">단계별 스트리밍</Link>
          </h3>
          <p>
            서로 다른 지연 시간(0.5초/1.5초/3초)의 Suspense 경계 3개가
            차례대로 채워집니다.
          </p>
        </div>
      </div>

      <div className="note">
        정량 비교는 <code>scripts/bench.sh</code>로 재현할 수 있습니다. 두
        페이지의 TTFB(첫 바이트 도착 시간)를 curl로 잽니다.
      </div>
    </div>
  );
}
