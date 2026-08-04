export const metadata = {
  title: "대시보드",
};

export default function DashboardPage() {
  return (
    <>
      <h1>대시보드 개요</h1>
      <p>
        <code>app/dashboard/page.tsx</code> 입니다. 왼쪽 사이드바는 상위
        폴더의 <code>layout.tsx</code>가 렌더링한 것입니다.
      </p>
      <div className="card">
        <h3>레이아웃이 유지된다는 것</h3>
        <p>
          <strong>설정</strong> 탭으로 이동해도 사이드바는 서버에서 다시
          렌더링되지 않고, 클라이언트에서도 언마운트되지 않습니다. 레이아웃의
          상태(스크롤 위치, 입력값, 자바스크립트 상태)가 유지됩니다.
        </p>
      </div>
    </>
  );
}
