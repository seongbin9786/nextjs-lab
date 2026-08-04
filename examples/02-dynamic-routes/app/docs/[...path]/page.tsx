import Link from "next/link";

// 캐치올 세그먼트: /docs 뒤의 모든 깊이를 배열로 받습니다.
// /docs/a/b/c → params.path = ["a", "b", "c"]
export default async function DocsPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>docs</span>
      </nav>
      <h1>캐치올 세그먼트</h1>
      <p>
        파일 경로: <code>app/docs/[...path]/page.tsx</code>
      </p>
      <table>
        <thead>
          <tr>
            <th>요청 URL</th>
            <th>params.path</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="metric">/docs/getting-started</td>
            <td className="metric">["getting-started"]</td>
          </tr>
          <tr>
            <td className="metric">/docs/guides/routing/dynamic</td>
            <td className="metric">["guides", "routing", "dynamic"]</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        지금 받은 값: <code className="metric">{JSON.stringify(path)}</code>
      </div>
      <p className="muted">
        참고: <code>/docs</code> 자체는 매칭되지 않습니다. 파라미터 없는
        경로까지 받으려면 선택적 캐치올(<code>[[...path]]</code>)을
        사용하세요. <Link href="/files">/files 예시</Link>에서 볼 수 있습니다.
      </p>
    </div>
  );
}
