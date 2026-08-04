import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>인증 패턴</h1>
      <p>
        서버 사이드 세션 인증의 기본 골격을 보여주는 예시입니다. 외부
        라이브러리 없이 <strong>쿠키 + 서명된 토큰</strong>만으로 구현해서
        각 계층이 무엇을 하는지 그대로 볼 수 있습니다.
      </p>

      <div className="grid cols-2">
        <div className="card">
          <h3>
            <Link href="/login">로그인</Link>
          </h3>
          <p>
            데모 계정: <code>admin@example.com</code> /{" "}
            <code>admin123</code>
          </p>
        </div>
        <div className="card">
          <h3>
            <Link href="/account">내 계정 (보호됨)</Link>
          </h3>
          <p>로그인하지 않고 들어가면 proxy가 로그인으로 보냅니다.</p>
        </div>
      </div>

      <h2>흐름</h2>
      <ol>
        <li>
          <strong>로그인</strong>: Server Action에서 자격 증명 검증 → 서명된
          세션 토큰을 <code>httpOnly</code> 쿠키에 저장
        </li>
        <li>
          <strong>요청마다</strong>: <code>proxy.ts</code>가 쿠키 유무를 빠르게
          확인(없으면 로그인으로 리다이렉트)
        </li>
        <li>
          <strong>페이지에서</strong>: 서버 컴포넌트가 쿠키의 토큰을{" "}
          <strong>서명 검증까지</strong> 해서 사용자 정보를 렌더링
        </li>
        <li>
          <strong>로그아웃</strong>: Server Action으로 쿠키 삭제
        </li>
      </ol>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>왜 두 번 검사하나요?</strong> proxy 검사는 빠르지만 얕습니다
          (쿠키 유무만). 프록시를 우회하는 경로(예: 직접 서버 호출)까지
          막으려면 페이지/API에서 <strong>반드시 다시 검증</strong>해야
          합니다.
        </p>
      </div>
    </div>
  );
}
