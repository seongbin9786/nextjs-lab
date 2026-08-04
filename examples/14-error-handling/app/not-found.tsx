import Link from "next/link";

// 존재하지 않는 라우트 전체의 폴백입니다.
export default function NotFound() {
  return (
    <div className="container">
      <h1>404</h1>
      <p>
        요청한 페이지가 없습니다. 이 화면은 루트{" "}
        <code>app/not-found.tsx</code>입니다.
      </p>
      <p>
        <Link className="button" href="/">
          홈으로
        </Link>
      </p>
    </div>
  );
}
