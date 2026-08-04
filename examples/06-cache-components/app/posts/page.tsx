import Link from "next/link";
import { getPosts } from "@/lib/data";
import { AddPostForm } from "@/components/add-post-form";

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div className="container">
      <h1>태그와 즉시 반영</h1>
      <p>
        아래 목록은 <code>getPosts()</code>(<code>&quot;use cache&quot;</code>{" "}
        + <code>cacheTag(&quot;posts&quot;)</code>)의 결과입니다. 새로고침해도
        서버는 다시 글 목록을 만들지 않습니다.
      </p>
      <div className="card">
        <ul style={{ margin: 0 }}>
          {posts.map((post) => (
            <li key={post.id}>
              <code className="metric">{String(post.id).padStart(2, "0")}</code>{" "}
              {post.title}
            </li>
          ))}
        </ul>
      </div>
      <AddPostForm />
      <div className="note">
        <p style={{ margin: 0 }}>
          웹훅처럼 <strong>Server Action 밖</strong>에서 무효화해야 한다면
          라우트 핸들러에서{" "}
          <code>{"revalidateTag(\"posts\", \"max\")"}</code>를 쓰세요. 이
          예시에도 <code>POST /api/revalidate-posts</code>가 준비되어
          있습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
