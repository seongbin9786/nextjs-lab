import Link from "next/link";

export const metadata = {
  title: "블로그",
};

const posts = [
  {
    slug: "file-system-routing",
    title: "파일 시스템 라우팅이란",
    excerpt: "폴더를 만들면 라우트가 됩니다. 라우터 설정 파일이 필요 없어요.",
  },
  {
    slug: "colocation",
    title: "컴포넌트, 스타일, 테스트를 한곳에",
    excerpt: "app/ 안에는 페이지 외의 파일도 함께 둘 수 있습니다.",
  },
];

// 라우트(폴더)가 아닌 파일은 URL에 영향을 주지 않습니다.
// posts 데이터처럼 페이지 전용 파일은 라우트 폴더 안에 함께 두면 됩니다.
export default function BlogPage() {
  return (
    <>
      <h1>블로그</h1>
      <p className="muted">
        파일 위치: <code>app/(marketing)/blog/page.tsx</code> → URL:{" "}
        <code>/blog</code>
      </p>
      <div className="grid">
        {posts.map((post) => (
          <div className="card" key={post.slug}>
            <h3>
              <Link href={`/blog/${post.slug}`}>{post.title}</Link>
            </h3>
            <p>{post.excerpt}</p>
          </div>
        ))}
      </div>
    </>
  );
}
