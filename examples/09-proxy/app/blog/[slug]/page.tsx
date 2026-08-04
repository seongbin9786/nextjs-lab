import Link from "next/link";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="container">
      <h1>블로그: {slug}</h1>
      <p>
        이 페이지는 <code>app/blog/[slug]/page.tsx</code>가 렌더링했습니다.
      </p>
      <p>
        지금 주소창 URL을 보세요. <code>/old-blog/{slug}</code>로 들어왔다면
        URL은 그대로인데 이 페이지가 보일 겁니다. proxy가 내부적으로{" "}
        <code>/blog/{slug}</code>로 리라이트했기 때문입니다.
      </p>
      <p className="muted">
        리라이트는 주소 변경 없이 라우트를 교체할 때 씁니다: 기존 URL 유지한
        채 구조 개편, A/B 테스트, 다국어 기본 경로 등.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
