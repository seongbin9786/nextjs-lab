import Link from "next/link";

export const metadata = {
  title: "두 번째 페이지",
};

export default function SecondPage() {
  return (
    <>
      <h1>두 번째 페이지</h1>
      <p>
        여기까지 오는 동안 레이아웃과 템플릿 중 누가 살아남았는지 확인하려면
        되돌아가 보세요.
      </p>
      <p>
        <Link className="button secondary" href="/layout-vs-template">
          ← 첫 번째 페이지로 돌아가기
        </Link>
      </p>
    </>
  );
}
