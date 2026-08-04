import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>에러 처리</h1>
      <p>
        App Router는 <strong>라우트 세그먼트 단위</strong>로 에러를 격리합니다.
        하위 페이지에서 에러가 나도 앱 전체가 죽지 않고, 그 세그먼트만{" "}
        <code>error.tsx</code>로 대체됩니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/reports">error.tsx 경계</Link>
          </h3>
          <p>클라이언트/서버 에러를 만들어 경계가 잡는 모습을 봅니다.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/reports/missing">not-found</Link>
          </h3>
          <p>
            존재하지 않는 리소스 → 세그먼트 전용 404 UI.
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/global">global-error.tsx</Link>
          </h3>
          <p>루트 레이아웃이 무너졌을 때의 최후 방어선.</p>
        </div>
      </div>

      <h2>파일 규칙</h2>
      <table>
        <thead>
          <tr>
            <th>파일</th>
            <th>역할</th>
            <th>범위</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>error.tsx</code></td>
            <td>렌더링 중 던져진 오류를 잡는 경계 (클라이언트 컴포넌트)</td>
            <td>해당 폴더와 하위 라우트</td>
          </tr>
          <tr>
            <td><code>not-found.tsx</code></td>
            <td><code>notFound()</code> 호출 시 UI</td>
            <td>해당 폴더와 하위 라우트</td>
          </tr>
          <tr>
            <td><code>global-error.tsx</code></td>
            <td>루트 레이아웃 오류 등 앱 전체가 깨졌을 때</td>
            <td>앱 전체 (자체 html/body 필요)</td>
          </tr>
        </tbody>
      </table>
      <div className="note">
        <p style={{ margin: 0 }}>
          <code>error.tsx</code>는 반드시 <strong>클라이언트
          컴포넌트</strong>여야 합니다. 에러 경계는 브라우저에서 동작하는
          React 기능이므로 서버 컴포넌트로 만들 수 없습니다.
        </p>
      </div>
    </div>
  );
}
