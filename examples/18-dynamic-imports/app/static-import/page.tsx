import Link from "next/link";
import { HeavyStatic } from "@/components/heavy-static";

// 정적 import: HeavyStatic(와 그 안의 big-data 170KB)이
// 이 페이지의 첫 로딩 JS에 "항상" 포함됩니다.
export default function StaticImportPage() {
  return (
    <div className="container">
      <h1>정적 import</h1>
      <p>
        <code>{"import { HeavyStatic } from \"@/components/heavy-static\""}</code>{" "}
        — 차트와 170KB 데이터가 첫 로딩 JS에 포함됩니다.
      </p>
      <HeavyStatic />
      <div className="note">
        <p style={{ margin: 0 }}>
          <Link href="/benchmark">정량 비교</Link> 페이지에서 이 페이지와{" "}
          <Link href="/lazy-load">next/dynamic 페이지</Link>의 첫 로딩 JS
          크기를 확인하세요.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
