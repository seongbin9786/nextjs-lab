import Link from "next/link";

export const metadata = {
  title: "layout vs template",
};

export default function FirstPage() {
  return (
    <>
      <h1>layout vs template</h1>
      <p>
        지금 보이는 초록 테두리는 <code>layout.tsx</code>, 주황 점선 테두리는{" "}
        <code>template.tsx</code>입니다. 둘 다 자식을 감싸지만{" "}
        <strong>페이지 이동 때의 동작이 다릅니다.</strong>
      </p>
      <ol>
        <li>각 테두리 안의 버튼을 몇 번 눌러 클릭 횟수를 올려보세요.</li>
        <li>
          <Link href="/layout-vs-template/second">두 번째 페이지</Link>로
          이동합니다.
        </li>
        <li>
          돌아와서 확인하면 <strong>레이아웃의 클릭 횟수는 그대로</strong>고,{" "}
          <strong>템플릿은 초기화</strong>되어 있습니다.
        </li>
      </ol>
      <p>
        <Link className="button" href="/layout-vs-template/second">
          두 번째 페이지로 이동 →
        </Link>
      </p>
      <h2>왜 이런 차이가 나나요?</h2>
      <p>
        레이아웃은 한 번 렌더링된 뒤 자식만 갈아끼우는 방식이라{" "}
        <strong>상태가 유지</strong>됩니다. 템플릿은 이동할 때마다 자식과 함께{" "}
        <strong>새 인스턴스로 다시 마운트</strong>됩니다.
      </p>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>layout.tsx</th>
            <th>template.tsx</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>이동 시 다시 마운트</td>
            <td>아니요 (상태 유지)</td>
            <td>예 (상태 초기화)</td>
          </tr>
          <tr>
            <td>뒤로가기 시 복원</td>
            <td>유지된 인스턴스</td>
            <td>새로 생성</td>
          </tr>
          <tr>
            <td>쓰임새</td>
            <td>공유 내비게이션, 공통 UI</td>
            <td>애니메이션, 페이지 진입 시마다 다시 실행해야 하는 효과</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
