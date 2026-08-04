import Link from "next/link";

export const metadata = {
  title: "컴포넌트, 스타일, 테스트를 한곳에",
};

export default function PostPage() {
  return (
    <>
      <nav className="breadcrumb">
        <Link href="/blog">블로그</Link> <span>/</span>{" "}
        <span>컴포넌트, 스타일, 테스트를 한곳에</span>
      </nav>
      <h1>컴포넌트, 스타일, 테스트를 한곳에</h1>
      <p>
        라우트 폴더에는 <code>page.tsx</code>만 둘 수 있는 것이 아닙니다. 이
        폴더 안의 <strong>page, layout, template, loading, error</strong> 같은
        예약 파일만 라우팅에 참여하고, 그 외 파일(컴포넌트, 데이터, 테스트)은
        그냥 그 자리에 함께 살아도 URL에 영향을 주지 않습니다.
      </p>
      <p>
        이 예시의 <code>components/top-nav.tsx</code>처럼 공용 컴포넌트는{" "}
        <code>components/</code>, <code>lib/</code> 같은 폴더로 옮기는 것이
        흔한 규칙입니다.
      </p>
    </>
  );
}
