import Link from "next/link";
import { notFound } from "next/navigation";

const posts: Record<string, { title: string; body: string }> = {
  first: {
    title: "첫 번째 글",
    body: "이 글은 generateStaticParams 덕분에 빌드 시점에 HTML로 만들어져 export됩니다.",
  },
  second: {
    title: "두 번째 글",
    body: "out/blog/second.html 로 직접 파일이 생긴 것을 확인할 수 있습니다.",
  },
};

export function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) notFound();

  return (
    <div className="container">
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <p>
        빌드 후 <code>out/blog/{slug}.html</code> 파일을 열어보세요. 완성된
        HTML이 들어 있습니다.
      </p>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
