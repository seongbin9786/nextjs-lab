import Link from "next/link";
import { PublicEnvDisplay } from "@/components/public-env-display";

export default function ClientEnvPage() {
  return (
    <div className="container">
      <h1>NEXT_PUBLIC_ 변수</h1>
      <p>
        브라우저에서 필요한 값(API 주소, feature flag 등)은{" "}
        <code>NEXT_PUBLIC_</code> 접두사를 붙입니다.
      </p>
      <PublicEnvDisplay />
      <h2>함정: 빌드 시 인라인</h2>
      <p>
        <code>NEXT_PUBLIC_</code> 값은 빌드 때 소스 코드에{" "}
        <strong>문자열 그대로 박힙니다</strong>.
      </p>
      <pre>
        <code>{`// 빌드 후 번들에는 이렇게 됩니다
const apiUrl = "https://api.example.com";`}</code>
      </pre>
      <ul>
        <li>
          그래서 <strong>빌드 후에는 바꿀 수 없습니다</strong>. 배포 단계별로
          값이 다르면 단계별로 다시 빌드해야 합니다.
        </li>
        <li>
          <code>{"NEXT_PUBLIC_X = {변수}"}</code> 같은 동적 할당은
          인라인되지 않아 동작하지 않습니다. 직접 참조(
          <code>process.env.NEXT_PUBLIC_X</code>)만 가능합니다.
        </li>
        <li>민감한 값은 절대 NEXT_PUBLIC_를 붙이지 마세요.</li>
      </ul>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
