import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>정적 export</h1>
      <p>
        이 앱은 <code>output: &quot;export&quot;</code>로 빌드되어{" "}
        <strong>순수 정적 파일</strong>로 배포됩니다. 서버 런타임이 필요
        없습니다.
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>빌드와 배포</h3>
        <pre style={{ margin: 0 }}>
          <code>{`pnpm build        # out/ 폴더에 정적 파일 생성
# out/ 을 아무 정적 호스팅에 업로드`}</code>
        </pre>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/blog/first">SSG 블로그 글</Link>
          </h3>
          <p>
            <code>generateStaticParams</code>로 만든 페이지도 export됩니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/client">클라이언트 인터랙션</Link>
          </h3>
          <p>정적으로 내보내도 클라이언트 JS는 그대로 동작합니다.</p>
        </div>
      </div>

      <h2>정적 export에서 못 쓰는 것</h2>
      <ul>
        <li>
          <strong>서버 전용 기능</strong>: Route Handlers, Server Actions,
          middleware/proxy, ISR, <code>headers()</code>/<code>cookies()</code>{" "}
          읽기
        </li>
        <li>
          <strong>동적 렌더링</strong>: 모든 페이지는 빌드 시점에 완성된
          HTML이어야 합니다.
        </li>
        <li>
          <strong>next/image 최적화</strong>: 서버가 없으므로{" "}
          <code>unoptimized</code> 또는 커스텀 로더 필요
        </li>
      </ul>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>판단 기준</strong>: 로그인, 개인화, 서버 데이터가 필요 없는{" "}
          마케팅 사이트·문서·포트폴리오라면 정적 export가 가장 단순하고
          저렴합니다. 하나라도 서버 기능이 필요하면 25예시의 standalone
          서버 배포를 보세요.
        </p>
      </div>
    </div>
  );
}
