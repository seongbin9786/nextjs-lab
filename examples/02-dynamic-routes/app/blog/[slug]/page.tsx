import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, posts } from "@/lib/data";

// 빌드 시점에 이 라우트를 어떤 파라미터로 미리 만들지 알려줍니다.
// 반환된 slug 3개는 빌드 중에 HTML로 생성되고(SSG),
// 그 외 slug는 요청 시점에 만들어집니다.
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  return {
    title: post ? post.title : "글 없음",
    description: post?.body.slice(0, 80),
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>blog</span> <span>/</span>{" "}
        <span>{post.slug}</span>
      </nav>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
      <div className="note">
        <p style={{ margin: 0 }}>
          이 글은 <code>generateStaticParams</code>에 포함되어{" "}
          <strong>빌드 시점에 HTML로 만들어졌습니다.</strong> 빌드 출력에서 ●
          (SSG) 표시를 확인해보세요.
        </p>
      </div>
    </div>
  );
}
