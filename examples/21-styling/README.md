# 21 — 스타일링

> CSS Modules + Tailwind v4를 한 앱에서 공존시키고, CSS-in-JS 선택 기준을 정리합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/css-modules` — `*.module.css` 자동 스코프
- `/tailwind` — 유틸리티 클래스
- `/css-in-js` — 런타임 vs 제로 런타임 선택 기준

## 핵심 개념

### CSS Modules (제로 설정)

```tsx
import styles from "./card.module.css";
<div className={styles.card}>   // 빌드 시 해시되어 전역 충돌 없음
```

Next.js에 내장되어 별도 도구가 필요 없습니다. 정적이라 런타임 JS가 없습니다.

### Tailwind CSS v4

```js
// postcss.config.mjs
export default { plugins: ["@tailwindcss/postcss"] };
// globals.css
@import "tailwindcss";
```

v4부터 `tailwind.config.js` 없이 CSS `@theme`으로 토큰을 정의합니다.
**`@layer` 기반**이라 layer 밖에 있는 커스텀 CSS가 우선해 공존이 예측 가능합니다.

### CSS-in-JS 선택 기준

| 방식 | 예시 | 특징 |
| --- | --- | --- |
| 런타임 | styled-components | JS로 스타일 생성/주입 — 번들·렌더 비용 |
| 제로 런타임 | vanilla-extract | 빌드 때 CSS 추출 — RSC 친화 |
| 인라인 | `style={{}}` | 동적 값엔 간편, 재사용 불가 |

## 정량 비교: 런타임 비용

| 방식 | 클라이언트 JS에 포함되는 것 |
| --- | --- |
| CSS Modules / 전역 CSS | **0** (CSS는 별도 파일) |
| Tailwind | 0 (사용한 유틸리티만 빌드 때 추출) |
| 런타임 CSS-in-JS | 스타일 엔진 + 컴포넌트별 스타일 로직 |

첫 로딩 JS와 하이드레이션 비용에서 CSS Modules/Tailwind가 유리합니다.

## 좋은 활용 사례

- 전역 토큰/리셋: `globals.css` (이 예시의 디자인 토큰 패턴 참고)
- 컴포넌트 단위 분리: CSS Modules 또는 Tailwind 유틸리티
- 디자인 시스템: 디자인 토큰을 CSS 변수로 두고 양쪽에서 재사용
- 성능 민감 앱: 제로 런타임 CSS-in-JS 또는 CSS Modules

## DX 개선

- CSS Modules는 클래스명 충돌 걱정 없이 파일 옆에 배치 (colocation)
- Tailwind v4는 설정 파일 없이 CSS만으로 완결

## 관련 문서

- [CSS Modules](https://nextjs.org/docs/app/building-your-application/styling/css-modules)
- [Tailwind CSS](https://nextjs.org/docs/app/guides/tailwind-v4)
- [CSS-in-JS](https://nextjs.org/docs/app/building-your-application/styling/css-in-js)
