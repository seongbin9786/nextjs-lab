import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions";

export default async function AdminPage() {
  // proxy에서 이미 검사했지만 서버에서도 한 번 더 검사합니다.
  // proxy 검사는 UX용(빨리 로그인 화면으로 보내기),
  // 여기가 진짜 보안 경계입니다.
  const jar = await cookies();
  if (jar.get("auth")?.value !== "1") {
    redirect("/login?from=/admin");
  }

  return (
    <div className="container">
      <h1>관리자 화면</h1>
      <p>
        <code>auth</code> 쿠키가 있어서 여기까지 왔습니다. 이 페이지는
        두 단계 검사를 통과했습니다.
      </p>
      <ol>
        <li>
          <strong>proxy.ts</strong>: 쿠키 유무만 빠르게 확인(낙관적 검사)
        </li>
        <li>
          <strong>서버 컴포넌트</strong>: 쿠키를 직접 다시 확인(진짜 검사)
        </li>
      </ol>
      <div className="note">
        <p style={{ margin: 0 }}>
          proxy에서 DB 조회 같은 무거운 작업을 하면 모든 요청이 느려집니다.
          proxy는 <strong>되돌려 보내기 충분할 만큼만</strong> 확인하고,
          실제 검증은 여기서 하는 것이 권장 패턴입니다.
        </p>
      </div>
      <form action={logout}>
        <button type="submit">로그아웃 (쿠키 삭제)</button>
      </form>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
