import Link from "next/link";
import { LoginForm } from "@/components/login-form";

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
        데모 계정: <code>admin@example.com</code> / <code>admin123</code>{" "}
        또는 <code>dev@example.com</code> / <code>dev123</code>
      </p>
      <LoginForm from={from ?? "/account"} />
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
