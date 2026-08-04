import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container">
      <h1>404 — 찾을 수 없습니다</h1>
      <p>
        요청한 리소스가 없습니다. <code>notFound()</code>를 호출하면 이
        페이지가 렌더링되고 HTTP 상태 코드는 404가 됩니다.
      </p>
      <p>
        <Link className="button" href="/">
          홈으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
