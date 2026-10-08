import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ServerEnvPage() {
  // NEXT_PUBLIC_ 이 없는 변수는 서버에서만 읽힙니다.
  const dbPassword = process.env.DB_PASSWORD ?? "(없음)";
  const masked =
    dbPassword.length <= 4
      ? "****"
      : dbPassword.slice(0, 2) + "*".repeat(dbPassword.length - 4) + dbPassword.slice(-2);

  return (
    <div className="container">
      <h1>서버 전용 변수</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          DB_PASSWORD(서버에서 읽음):{" "}
          <strong className="metric">{masked}</strong>
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          (실제 앱에서는 화면에도 찍지 않습니다. 여기서는 데모라 마스킹해서
          표시합니다.)
        </p>
      </div>
      <h2>왜 클라이언트에서 못 읽나요?</h2>
      <p>
        <code>process.env.DB_PASSWORD</code>를 클라이언트 컴포넌트에서
        읽으면 <code>undefined</code>입니다. Next.js가{" "}
        <strong>NEXT_PUBLIC_ 접두사가 없는 변수를 브라우저 번들에서
        제외</strong>하기 때문입니다. 덕분에 비밀 값이 실수로 노출되는 것을
        막습니다.
      </p>
      <div className="note">
        <p style={{ margin: 0 }}>
          확인 방법: DevTools → Sources → 번들 파일에서 위에 표시된
          DB_PASSWORD 값(<code>pnpm dev</code>에서는{" "}
          <code>dev-password</code>, 프로덕션 빌드에서는{" "}
          <code>base-password</code>)을 검색해보세요. 없습니다. 반대로
          NEXT_PUBLIC_ 값은 <Link href="/client">다음 페이지</Link>에서
          볼 수 있습니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
