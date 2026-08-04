import Link from "next/link";
import { posts, products } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="container">
      <h1>동적 라우팅</h1>
      <p>
        폴더 이름에 대괄호(<code>[ ]</code>)를 쓰면 URL의 일부가{" "}
        <strong>파라미터</strong>가 됩니다. 이 예시는 4가지 동적 라우트 패턴을
        다룹니다.
      </p>

      <h2>1. 기본 동적 세그먼트 — [id]</h2>
      <p>
        <code>app/products/[id]/page.tsx</code> → <code>/products/:id</code>.
        존재하지 않는 id는 <code>notFound()</code>로 404를 만듭니다.
      </p>
      <ul>
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.id}`}>/products/{p.id}</Link>
          </li>
        ))}
        <li>
          <Link href="/products/not-exist">/products/not-exist (404 확인)</Link>
        </li>
      </ul>

      <h2>2. 빌드 시 미리 생성 — generateStaticParams</h2>
      <p>
        <code>app/blog/[slug]/page.tsx</code>는{" "}
        <code>generateStaticParams</code>로 글 3개를 빌드 때 미리 HTML로
        만들어 둡니다(SSG).
      </p>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>/blog/{post.slug}</Link>
          </li>
        ))}
      </ul>

      <h2>3. 캐치올 세그먼트 — [...path]</h2>
      <p>
        <code>app/docs/[...path]/page.tsx</code>는 깊이에 상관없이 나머지
        경로를 전부 배열로 받습니다.
      </p>
      <ul>
        <li>
          <Link href="/docs/getting-started">/docs/getting-started</Link>
        </li>
        <li>
          <Link href="/docs/guides/routing/dynamic">
            /docs/guides/routing/dynamic
          </Link>
        </li>
      </ul>

      <h2>4. 선택적 캐치올 세그먼트 — [[...path]]</h2>
      <p>
        <code>app/files/[[...path]]/page.tsx</code>는 파라미터가 없는{" "}
        <code>/files</code> 자체도 매칭합니다.
      </p>
      <ul>
        <li>
          <Link href="/files">/files (파라미터 없음)</Link>
        </li>
        <li>
          <Link href="/files/2026/report.pdf">/files/2026/report.pdf</Link>
        </li>
      </ul>
    </div>
  );
}
