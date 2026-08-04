import Link from "next/link";

export default function GlobalErrorPage() {
  return (
    <div className="container">
      <h1>global-error.tsx</h1>
      <p>
        <code>global-error.tsx</code>는 <strong>앱 전체</strong>가 깨졌을 때
        표시됩니다. 대표적으로 <strong>루트 레이아웃</strong>이 에러를
        던졌을 때입니다.
      </p>
      <h2>왜 별도의 파일이 필요한가요?</h2>
      <p>
        일반 <code>error.tsx</code>는 루트 레이아웃{" "}
        <strong>안</strong>에 렌더링됩니다. 그런데 루트 레이아웃 자체가
        망가지면 그걸 감쌀 껍데기가 사라집니다. 그래서{" "}
        <code>global-error.tsx</code>는{" "}
        <strong>자체 <code>&lt;html&gt;</code>과 <code>&lt;body&gt;</code></strong>
        를 직접 그려야 합니다.
      </p>
      <h2>이 예시에서 직접 보는 법</h2>
      <p>
        이 예시는 홈과 내비게이션을 유지한 채 섹션 단위 에러를 보여주는 데
        초점을 맞춰서, 루트 레이아웃을 실제로 망가뜨리지는 않습니다. 대신
        이렇게 확인하세요:
      </p>
      <ol>
        <li>
          <code>app/layout.tsx</code>의 <code>{"{children}"}</code> 위에
          임시로 <code>{"throw new Error(\"테스트\")"}</code>를 넣습니다.
        </li>
        <li>아무 페이지나 새로고침합니다.</li>
        <li>
          전체 화면이 <code>global-error.tsx</code>로 바뀝니다.
        </li>
      </ol>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>실전 팁</strong>: <code>global-error</code>는 스타일, 폰트,
          분석 스크립트가 없는 "맨몸" 상태입니다. 그래서 최소한의 인라인
          스타일과 오류 정보(digest), 새로고침/홈 이동 버튼만 두는 것이
          일반적입니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
