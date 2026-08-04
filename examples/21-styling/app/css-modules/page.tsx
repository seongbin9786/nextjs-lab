import Link from "next/link";
import { CssModulesCard } from "@/components/css-modules-card";

export default function CssModulesPage() {
  return (
    <div className="container">
      <h1>CSS Modules</h1>
      <p>
        파일 이름이 <code>.module.css</code>로 끝나면 CSS Modules로
        처리됩니다. import해서 객체처럼 클래스를 씁니다.
      </p>
      <CssModulesCard />
      <h2>왜 쓰나요?</h2>
      <ul>
        <li>
          <strong>자동 스코프</strong>: 클래스 이름이 빌드 시 해시되어{" "}
          <code>.card</code>가 전역으로 새어 나가지 않습니다.
        </li>
        <li>
          <strong>제로 설정</strong>: Next.js에 내장되어 별도 도구가 필요
          없습니다.
        </li>
        <li>
          <strong>정적</strong>: CSS 파일이 빌드 때 추출되어 런타임 JS가 들지
          않습니다. (CSS-in-JS와의 차이)
        </li>
      </ul>
      <h2>코드</h2>
      <pre>
        <code>{`// css-modules-card.tsx
import styles from "./css-modules-card.module.css";

<div className={styles.card}>
  <h3 className={styles.title}>...</h3>
</div>`}</code>
      </pre>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
