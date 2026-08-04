import Link from "next/link";

// 선택적 캐치올 세그먼트: 대괄호가 두 겹입니다.
// /files 처럼 파라미터가 없는 URL도 매칭됩니다.
export default async function FilesPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path } = await params;

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">홈</Link> <span>/</span> <span>files</span>
      </nav>
      <h1>선택적 캐치올 세그먼트</h1>
      <p>
        파일 경로: <code>app/files/[[...path]]/page.tsx</code>
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
            <td className="metric">/files</td>
            <td className="metric">undefined</td>
          </tr>
          <tr>
            <td className="metric">/files/2026</td>
            <td className="metric">["2026"]</td>
          </tr>
          <tr>
            <td className="metric">/files/2026/report.pdf</td>
            <td className="metric">["2026", "report.pdf"]</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        지금 받은 값:{" "}
        <code className="metric">
          {path ? JSON.stringify(path) : "undefined"}
        </code>
      </div>
      <p>
        <Link href="/files/2026/report.pdf">파라미터 있는 주소로 이동</Link>
        {" · "}
        <Link href="/">홈으로</Link>
      </p>
    </div>
  );
}
