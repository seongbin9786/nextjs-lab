import Link from "next/link";

export default function HomePage() {
  const renderedAt = new Date().toLocaleTimeString("ko-KR");

  return (
    <div className="container">
      <h1>
        서버 vs 클라이언트 컴포넌트{" "}
        <span className="badge server">이 페이지는 서버 컴포넌트</span>
      </h1>
      <p>
        App Router의 모든 컴포넌트는 <strong>기본이 서버 컴포넌트</strong>
        입니다. 서버에서 HTML로 렌더링되고, 자바스크립트가 브라우저로
        전송되지 않습니다. 상호작용이 필요할 때만{" "}
        <code>"use client"</code>로 클라이언트 컴포넌트를 만듭니다.
      </p>
      <p className="note">
        이 문단의 렌더링 시각: <strong className="metric">{renderedAt}</strong>{" "}
        — 새로고침해도 서버에서 다시 계산됩니다. 버튼을 눌러도 바뀌지
        않습니다(서버는 버튼 클릭을 모릅니다).
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/client-interactive">클라이언트 컴포넌트</Link>
          </h3>
          <p>
            <code>useState</code>, 이벤트 핸들러, 브라우저 API를 쓰는
            컴포넌트. <code>"use client"</code>로 선언합니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/server-only">서버 전용 코드</Link>
          </h3>
          <p>
            파일 시스템 접근, 비밀 키 사용처럼 서버에서만 실행되는 코드.
            클라이언트 번들에 포함되지 않습니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/composition">합성 패턴</Link>
          </h3>
          <p>
            서버 컴포넌트 안에 클라이언트 컴포넌트를 넣고, 그 사이에
            서버에서 렌더링한 children을 흘려보내는 패턴입니다.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/boundary">경계 확인하기</Link>
          </h3>
          <p>
            어느 코드까지가 클라이언트 번들에 포함되는지, 경계는 어떻게
            정해지는지 확인합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
