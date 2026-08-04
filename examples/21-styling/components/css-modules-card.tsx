import styles from "./css-modules-card.module.css";

// .module.css 로 끝나는 파일은 CSS Modules로 처리됩니다.
// import하면 클래스 이름이 자동 스코프 처리된 객체가 들어옵니다.
export function CssModulesCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        CSS Modules 카드 <span className={styles.highlight}>스코프 안전</span>
      </h3>
      <p style={{ margin: 0 }}>
        이 카드의 <code>.card</code> 클래스는 전역의{" "}
        <code>.card</code>와 이름이 같지만 서로 영향을 주지 않습니다.
        빌드 출력에서 실제 클래스 이름이 해시되어 있는지 확인해보세요.
      </p>
    </div>
  );
}
