import Link from "next/link";
import { ManualButtons } from "@/components/manual-buttons";

export default function ManualPage() {
  return (
    <div className="container">
      <h1>폼 없이 호출하기</h1>
      <p>
        Server Action은 폼 제출이 아니어도 호출할 수 있습니다.{" "}
        <code>useTransition</code>으로 감싸면 실행 중 상태를 얻을 수
        있습니다.
      </p>
      <ManualButtons />
      <h2>정리</h2>
      <ul>
        <li>
          <strong>폼</strong>: <code>{"<form action={serverAction}>"}</code> —
          JS가 꺼져 있어도 네이티브 제출로 동작(점진적 향상).
        </li>
        <li>
          <strong>버튼/이벤트</strong>: <code>useTransition</code> 또는{" "}
          <code>onClick={"{"} startTransition(...) {"}"}</code>으로 호출.
        </li>
        <li>
          <strong>입력값</strong>: 폼이면 <code>FormData</code>, 직접 호출이면
          일반 인수로 전달합니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
