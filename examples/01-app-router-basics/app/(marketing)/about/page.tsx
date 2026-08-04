export const metadata = {
  title: "소개",
};

// 이 파일의 실제 경로는 app/(marketing)/about/page.tsx 지만
// URL은 /about 입니다. 괄호 폴더 (marketing)은 URL에 포함되지 않습니다.
export default function AboutPage() {
  return (
    <>
      <h1>소개 (route group)</h1>
      <p>
        이 페이지의 파일 경로는 <code>app/(marketing)/about/page.tsx</code>{" "}
        입니다. 하지만 URL은 <code>/about</code>이죠.
      </p>
      <p>
        <strong>라우트 그룹</strong>은 폴더 이름이 괄호 <code>( )</code>로
        둘러싸인 폴더입니다. URL 세그먼트를 만들지 않고 파일을 논리적으로
        묶을 때 사용합니다.
      </p>

      <h2>언제 쓰나요?</h2>
      <ul>
        <li>
          <strong>레이아웃 분리</strong>: <code>(marketing)</code>과{" "}
          <code>(shop)</code> 그룹마다 다른 <code>layout.tsx</code>를 두고
          싶을 때
        </li>
        <li>
          <strong>조직화</strong>: URL은 그대로 두고 코드만 팀/도메인별로
          정리하고 싶을 때
        </li>
        <li>
          <strong>같은 URL 세그먼트 충돌 회피</strong>: 두 그룹에서 같은
          이름의 폴더를 써도 URL이 겹치지 않게 관리 가능
        </li>
      </ul>

      <div className="note">
        라우트 그룹 안의 각 그룹은 자기만의 <code>layout.tsx</code>를 가질 수
        있고, 이 그룹은 루트 레이아웃 아래에 중첩됩니다.
      </div>
    </>
  );
}
