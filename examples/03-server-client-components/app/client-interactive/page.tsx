import Link from "next/link";
import { Counter } from "@/components/counter";

export default function ClientPage() {
  return (
    <div className="container">
      <h1>클라이언트 컴포넌트</h1>
      <Counter />
      <h2>언제 클라이언트 컴포넌트를 쓰나요?</h2>
      <ul>
        <li>
          <code>useState</code>, <code>useReducer</code> 같은 상태가 필요할 때
        </li>
        <li>
          <code>onClick</code>, <code>onChange</code> 같은 이벤트 핸들러가
          필요할 때
        </li>
        <li>
          <code>useEffect</code>, <code>window</code>, <code>localStorage</code>{" "}
          같은 브라우저 전용 기능이 필요할 때
        </li>
        <li>클라이언트 전용 훅/라이브러리를 사용하는 서드파티 컴포넌트</li>
      </ul>
      <h2>주의할 점</h2>
      <ul>
        <li>
          서버에서 먼저 렌더링(SSR)된 후 브라우저에서 하이드레이션됩니다.
          즉, "클라이언트 컴포넌트 = 브라우저 전용"은 아닙니다.
        </li>
        <li>
          서버 컴포넌트는 import할 수 없습니다. 대신{" "}
          <Link href="/composition">children으로 받아</Link> 합성합니다.
        </li>
        <li>
          <code>fs</code>, <code>process.env</code>(서버 전용 변수) 등
          서버 전용 API를 직접 쓸 수 없습니다.
        </li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
