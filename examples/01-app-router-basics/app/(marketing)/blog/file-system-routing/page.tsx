import Link from "next/link";

export const metadata = {
  title: "파일 시스템 라우팅이란",
};

export default function PostPage() {
  return (
    <>
      <nav className="breadcrumb">
        <Link href="/blog">블로그</Link> <span>/</span>{" "}
        <span>파일 시스템 라우팅이란</span>
      </nav>
      <h1>파일 시스템 라우팅이란</h1>
      <p>
        이 페이지는 <code>app/(marketing)/blog/file-system-routing/page.tsx</code>
        에 있습니다. 중첩 폴더가 곧 중첩 URL(<code>/blog/file-system-routing</code>
        )이 됩니다.
      </p>
      <p>
        SPA 프레임워크(React Router 등)는 라우트 정의를 코드 한곳에 모아서
        관리하지만, App Router에서는 <strong>폴더 구조가 라우트 정의</strong>
        입니다. 페이지가 늘어나도 거대한 라우터 설정 파일이 생기지 않고, 파일
        위치만 보면 URL을 알 수 있습니다.
      </p>
    </>
  );
}
