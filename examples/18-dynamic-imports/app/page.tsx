import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>동적 import와 지연 로딩</h1>
      <p>
        첫 화면에 필요 없는 컴포넌트(차트, 에디터, 모달)까지 전부 첫
        번들에 넣으면 페이지가 무거워집니다.{" "}
        <code>next/dynamic</code>과 <code>React.lazy</code>로{" "}
        <strong>필요할 때만</strong> 코드를 내려받게 만들 수 있습니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/static-import">정적 import</Link>
          </h3>
          <p>무거운 차트가 첫 로딩 JS에 포함됩니다. 비교군입니다.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/lazy-load">next/dynamic</Link>
          </h3>
          <p>같은 차트를 필요할 때만 로드합니다. 번들에서 분리됩니다.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/no-ssr">ssr: false</Link>
          </h3>
          <p>브라우저 API가 필수라 서버 렌더링을 건너뛰는 컴포넌트.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/benchmark">정량 비교</Link>
          </h3>
          <p>빌드 출력의 First Load JS 숫자로 차이를 확인합니다.</p>
        </div>
      </div>

      <div className="note">
        <p style={{ margin: 0 }}>
          이 예시의 <code>lib/big-data.ts</code>는 의도적으로 170KB짜리
          데이터 리터럴입니다. 어느 페이지가 이걸 첫 로딩에 포함하는지가
          핵심입니다.
        </p>
      </div>
    </div>
  );
}
