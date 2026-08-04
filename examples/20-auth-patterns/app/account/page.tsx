import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  // proxy가 쿠키 '유무'를 봤다면, 여기서는 '서명'까지 검증합니다.
  const jar = await cookies();
  const payload = verifySessionToken(jar.get(SESSION_COOKIE)?.value);

  if (!payload) {
    // 서명이 틀렸거나 만료됨 → 로그인으로
    redirect("/login?from=/account");
  }

  const { user } = payload;

  return (
    <div className="container">
      <h1>내 계정</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          이름: <strong>{user.name}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          이메일: <code>{user.email}</code>
        </p>
        <p style={{ margin: "4px 0" }}>
          세션 만료:{" "}
          <span className="metric">
            {new Date(payload.exp).toLocaleTimeString("ko-KR")}
          </span>
        </p>
      </div>
      <p>
        이 페이지는 <strong>로그인한 사용자</strong>에게만 서버에서
        렌더링됩니다. 세션 토큰은 <code>httpOnly</code> 쿠키에 있어서
        브라우저 JS로는 읽을 수 없습니다.
      </p>
      <form action={logout}>
        <button type="submit">로그아웃</button>
      </form>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
