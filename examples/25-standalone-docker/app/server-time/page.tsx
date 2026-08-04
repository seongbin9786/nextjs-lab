import Link from "next/link";

// 매 요청 서버에서 렌더링되는 동적 페이지. 서버가 살아 있어야 동작합니다.
export const dynamic = "force-dynamic";

export default function ServerTimePage() {
  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });

  return (
    <div className="container">
      <h1>서버 렌더링 확인</h1>
      <div className="card">
        <p style={{ margin: 0 }}>
          서버 시각: <strong className="metric">{now}</strong>
        </p>
      </div>
      <p>
        새로고침할 때마다 시각이 바뀝니다. 이 페이지는 정적 파일이 아니라{" "}
        <strong>요청 시점에 서버가 렌더링</strong>하므로, standalone 서버(또는
        컨테이너)가 실행 중이어야 합니다.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
