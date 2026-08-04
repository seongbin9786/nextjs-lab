import Link from "next/link";

// app/reports 전용 404 UI. 루트 not-found.tsx보다 우선합니다.
export default function ReportsNotFound() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>보고서를 찾을 수 없습니다</h2>
      <p>
        이 화면은 <code>app/reports/not-found.tsx</code>입니다. 루트{" "}
        <code>not-found.tsx</code> 대신 <strong>섹션 전용</strong> 404가
        표시됐습니다.
      </p>
      <p>
        <Link className="button secondary" href="/reports">
          보고서 목록으로
        </Link>
      </p>
    </div>
  );
}
