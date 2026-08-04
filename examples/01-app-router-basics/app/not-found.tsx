import Link from "next/link";

// 존재하지 않는 라우트, 또는 notFound()를 호출한 곳에서 렌더링됩니다.
// app/not-found.tsx 는 전체 앱의 폴백입니다.
export default function NotFound() {
  return (
    <>
      <h1>404 — 페이지를 찾을 수 없습니다</h1>
      <p>
        요청한 주소에 해당하는 <code>page.tsx</code>가 없습니다. 이 화면은{" "}
        <code>app/not-found.tsx</code>가 렌더링했습니다.
      </p>
      <p>
        <Link className="button" href="/">
          홈으로 돌아가기
        </Link>
      </p>
    </>
  );
}
