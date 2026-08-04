import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <h1>App Router 기본기</h1>
      <p>
        Next.js의 App Router는 <code>app/</code> 디렉터리의{" "}
        <strong>파일 구조가 곧 URL 구조</strong>가 되는 파일 시스템 라우팅입니다.
        이 예시는 설정 파일 없이 폴더와 파일만으로 라우트를 만드는 방법을
        보여줍니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            페이지 <span className="badge">page.tsx</span>
          </h3>
          <p>
            폴더 안의 <code>page.tsx</code>가 해당 URL의 화면이 됩니다.{" "}
            <Link href="/about">/about</Link>,{" "}
            <Link href="/blog">/blog</Link> 페이지를 눌러보세요.
          </p>
        </div>

        <div className="card">
          <h3>
            레이아웃 <span className="badge">layout.tsx</span>
          </h3>
          <p>
            <code>layout.tsx</code>는 자식 라우트가 바뀌어도{" "}
            <strong>다시 렌더링되지 않고 유지</strong>됩니다.{" "}
            <Link href="/dashboard">대시보드</Link>의 중첩 레이아웃을
            확인해보세요.
          </p>
        </div>

        <div className="card">
          <h3>
            라우트 그룹 <span className="badge">(폴더)</span>
          </h3>
          <p>
            <code>(marketing)</code>처럼 괄호 폴더는 URL에 드러나지 않는
            묶음입니다. <code>app/(marketing)/about/page.tsx</code>의 URL은
            그냥 <code>/about</code>입니다.
          </p>
        </div>

        <div className="card">
          <h3>
            템플릿 <span className="badge">template.tsx</span>
          </h3>
          <p>
            레이아웃과 비슷하지만 이동할 때마다{" "}
            <strong>새로 마운트</strong>됩니다.{" "}
            <Link href="/layout-vs-template">비교 페이지</Link>에서 눈으로
            확인해보세요.
          </p>
        </div>
      </div>

      <div className="note">
        존재하지 않는 주소(예: <Link href="/no-such-page">/no-such-page</Link>
        )를 열면 <code>app/not-found.tsx</code>가 렌더링됩니다.
      </div>
    </>
  );
}
