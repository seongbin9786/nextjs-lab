import Link from "next/link";

export default function ReportsPage() {
  return (
    <>
      <h1>보고서 섹션</h1>
      <p>
        이 섹션(<code>app/reports</code>)에는 자체{" "}
        <code>error.tsx</code>가 있습니다. 여기서 나는 에러는 홈까지 번지지
        않고 이 섹션 안에서 처리됩니다.
      </p>
      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/reports/crash-client">클라이언트 에러 만들기</Link>
          </h3>
          <p>버튼을 누르면 렌더링 중에 오류를 던집니다.</p>
        </div>
        <div className="card">
          <h3>
            <Link href="/reports/crash-server">서버 에러 만들기</Link>
          </h3>
          <p>서버 컴포넌트가 렌더링 중에 오류를 던집니다.</p>
        </div>
      </div>
    </>
  );
}
