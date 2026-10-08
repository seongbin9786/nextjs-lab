export const metadata = {
  title: "대시보드 설정",
};

export default function SettingsPage() {
  return (
    <>
      <h1>설정</h1>
      <p>
        <code>app/dashboard/settings/page.tsx</code> 입니다. 파일 구조가
        그대로 URL(<code>/dashboard/settings</code>)이 되었습니다.
      </p>
      <label>아무거나 입력해보기</label>
      <input placeholder="이 입력값은 페이지 이동 시 사라집니다" />
      <p className="muted">
        페이지(page)는 이동할 때마다 새로 렌더링됩니다. 반면 레이아웃은
        유지되죠. 입력값이 유지되는 컴포넌트를 만들고 싶다면 상태를 레이아웃
        쪽으로 올리거나, React 19.2의 Activity를 검토하세요.
      </p>
    </>
  );
}
