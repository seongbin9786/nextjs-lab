import Link from "next/link";
import { login } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="container">
      <h1>로그인</h1>
      <p>
        이 페이지는 <code>/admin</code>에 쿠키 없이 접근하면 proxy가
        리다이렉트시키는 곳입니다. <code>from</code> 파라미터:{" "}
        <code className="metric">{from ?? "(없음)"}</code>
      </p>
      <form action={login} className="card">
        <input type="hidden" name="from" value={from ?? "/admin"} />
        <p className="muted">
          데모라 자격 증명 입력이 없습니다. 버튼만 누르면{" "}
          <code>auth=1</code> 쿠키가 심어집니다.
        </p>
        <button type="submit">로그인</button>
      </form>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
