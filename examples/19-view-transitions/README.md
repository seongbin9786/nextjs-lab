# 19 — View Transitions

> React 19.2의 `ViewTransition` 컴포넌트로 화면 전환을 선언적으로 애니메이션합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` 갤러리에서 썸네일 클릭 → 이미지가 **모프하며** 상세로 확대
- `/photo/1`에서 돌아가기 → 반대 방향 슬라이드
- 크로미움 계열 또는 최신 Safari/Firefox에서 확인 (미지원 브라우저는 애니메이션 없이 정상 동작)

## 4가지 패턴

| 패턴 | 의미 | 구현 |
| --- | --- | --- |
| 공유 요소 모프 | "같은 대상이 커지는 것" | 양쪽에 같은 `name` |
| Suspense 리빌 | 데이터 도착 | fallback에 exit, 콘텐츠에 enter |
| 방향 슬라이드 | 앞으로/뒤로 이동 | `transitionTypes` + enter/exit 매핑 |
| 같은 라우트 크로스페이드 | 탭 전환 | `key` + `share="auto"` |

## 핵심 개념

### 공유 요소 모프

```tsx
// 갤러리 썸네일과 상세 이미지 모두 같은 name
<ViewTransition name={`photo-${id}`} share="morph" default="none">
  <img src={...} />
</ViewTransition>
```

같은 `name`끼리 브라우저가 이어줍니다. 위치/크기 변화가 자동 애니메이션.

### 방향 내비게이션

```tsx
<Link href={`/photo/${id}`} transitionTypes={["nav-forward"]}>
<Link href="/" transitionTypes={["nav-back"]}>

// enter/exit를 전환 타입별로 매핑
<ViewTransition
  enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
  exit={{ ... }}
/>
```

CSS는 `::view-transition-old/new(.nav-forward)` 등으로 정의합니다
(`app/globals.css` 참고).

## 정량 비교: 애니메이션 라이브러리 vs View Transitions API

| 방식 | 비용 |
| --- | --- |
| framer-motion 등 JS 애니메이션 | 번들 추가 + JS로 매 프레임 계산 |
| View Transitions API | **브라우저 네이티브** — JS 번들 0, 합성 스레드에서 실행 |

`import { ViewTransition } from "react"` 만으로 되고, CSS만 추가됩니다.
별도 설정이 필요 없습니다 (App Router가 React canary를 사용).

## 좋은 활용 사례

- 사진/상품 상세 전환: 공유 요소 모프
- 목록↔상세 방향 슬라이드로 위계 표현
- `prefers-reduced-motion`에서 애니메이션 제거 (이 예시에 포함)
- 전환 중 클릭 먹통 방지를 위해 `::view-transition { pointer-events: none }`

## DX 개선

- 수동 mount/unmount 추적 없이 "이 요소가 이어진다"를 `name`으로 선언
- 브라우저 뒤로가기도 자동 애니메이션

## 관련 문서

- [View Transitions 가이드](https://nextjs.org/docs/app/guides/view-transitions)
- [React ViewTransition](https://react.dev/reference/react/ViewTransition)
