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
- Next.js 16.3.0 + React 19.2.8 기준입니다. App Router는 `ViewTransition`이
  포함된 React canary 채널 기능을 번들하므로 `react@canary`를 따로 설치할
  필요가 없습니다. `import { ViewTransition } from "react"`로 바로 씁니다.

## 이 예시가 보여주는 것

Next.js 뷰 전환 가이드가 소개하는 4가지 패턴입니다.

| 패턴 | 의미 | 구현 | 이 예시에서 |
| --- | --- | --- | --- |
| 공유 요소 모프 | "같은 대상이 커지는 것" | 양쪽에 같은 `name` | `app/page.tsx`, `app/photo/[id]/page.tsx` |
| Suspense 리빌 | 데이터 도착 | fallback에 exit, 콘텐츠에 enter | 미포함 (가이드 참고) |
| 방향 슬라이드 | 앞으로/뒤로 이동 | `transitionTypes` + enter/exit 매핑 | 양쪽 페이지 + `app/globals.css` |
| 같은 라우트 크로스페이드 | 탭 전환 | `key` + `share="auto"` | 미포함 (가이드 참고) |

패턴별 역할: 공유 요소 모프는 "같은 것을 더 깊이 보는 중", Suspense 리빌은
"데이터가 도착했음", 방향 슬라이드는 "앞으로/뒤로 이동", 크로스페이드는
"같은 장소에서 내용만 바뀜"을 사용자에게 전달합니다.

## 동작 원리

### 1단계: 브라우저 네이티브 API — `document.startViewTransition()`

View Transitions API의 같은 문서(SPA) 전환은 `document.startViewTransition()`
한 함수로 시작합니다. MDN과 Next.js 문서를 종합하면 과정은 네 단계입니다.

1. **옛 화면 스냅샷 촬영**: 브라우저가 현재 화면을 비트맵으로 캡처합니다.
2. **DOM 변경**: 콜백으로 넘긴 DOM 업데이트가 실행됩니다. React라면 컴포넌트
   트리를 새 상태로 바꾸는 것입니다.
3. **새 화면 스냅샷 촬영**: 바뀐 DOM의 스냅샷을 캡처합니다.
4. **크로스페이드**: 두 스냅샷 사이를 브라우저가 애니메이션합니다.
   기본은 크로스페이드이고, CSS로 임의의 애니메이션을 입힐 수 있습니다.

```text
[1] 옛 상태 스냅샷          [2] DOM 교체 콜백          [3] 새 상태 스냅샷
┌─────────────┐            ┌─────────────┐            ┌─────────────┐
│  갤러리 화면  │  ───────►  │  트리 업데이트 │  ───────►  │  상세 화면    │
└─────────────┘            └─────────────┘            └─────────────┘
       └───────────── [4] 크로스페이드 애니메이션 ─────────────┘
```

애니메이션은 실제 DOM이 아니라 **뷰 전환 오버레이**의 의사 요소(pseudo-element)
트리에서 일어납니다. 이 트리를 알아야 CSS를 어디에 쓰는지 이해됩니다.

| 의사 요소 | 역할 |
| --- | --- |
| `::view-transition` | 오버레이 전체의 뿌리. 페이지 모든 것 위에 올라옴 |
| `::view-transition-group(name)` | 전환 하나(요소 하나)의 컨테이너 |
| `::view-transition-image-pair(name)` | 같은 이름의 옛/새 스냅샷을 함께 담는 컨테이너 |
| `::view-transition-old(name)` | 전환 전 스냅샷 (정적 비트맵) |
| `::view-transition-new(name)` | 전환 후 표현 |

그리고 `view-transition-name` CSS 속성이 "이 요소는 전체 페이지 크로스페이드와
별개로 개별 애니메이션하겠다"는 선언입니다. 문서 전체에서 이름이 유일해야
합니다 — 같은 시각에 같은 이름이 둘이면 전환이 깨집니다.

### 2단계: MPA 전환 vs SPA 내비게이션 전환

같은 API 계열이지만 두 가지 맛이 있습니다.

- **같은 문서 전환 (SPA)**: `document.startViewTransition()`으로 JS가 DOM 교체를
  감싸는 방식입니다. JS가 DOM을 바꾸는 시점을 제어하므로, 어떤 변경이 전환에
  참여하는지 정밀하게 조정할 수 있습니다. React의 `ViewTransition`이 자동화하는
  것이 바로 이쪽입니다.
- **교차 문서 전환 (MPA)**: 페이지에서 페이지로 진짜 문서를 오가는 전통적
  내비게이션의 전환입니다. 두 문서가 모두 CSS `@view-transition` 규칙으로
  옵트인해야 하고, 떠나는 문서의 `pageswap` 이벤트와 도착하는 문서의
  `pagereveal` 이벤트로 애니메이션을 제어합니다.

Next.js App Router는 클라이언트 사이드 라우터로 트리를 제자리에서 갱신하므로
**같은 문서 전환** 쪽에 해당합니다. 즉, "페이지 이동"처럼 보여도 실제로는
하나의 문서 안에서 React 트리가 바뀌는 것이고, 그 교체를 브라우저가 스냅샷
쌍으로 애니메이션하는 구조입니다.

### 3단계: React 19.2 `ViewTransition` 컴포넌트의 통합

브라우저 API는 직접 쓰려면 스냅샷 시점 관리, 이름 유일성, 중단 처리를 전부
손으로 해야 합니다. React의 `ViewTransition` 컴포넌트는 이를 선언적으로 만듭니다.

```tsx
import { ViewTransition } from "react";
```

**애니메이션이 켜지는 조건**이 중요합니다. `ViewTransition` 애니메이션은
업데이트가 React의 **Transition**(`startTransition`), `<Suspense>`, 또는
`useDeferredValue`로 일어날 때만 활성화됩니다. 평범한 `setState`로는 켜지지
않습니다. Next.js의 라우트 내비게이션은 Transition으로 처리되므로, 내비게이션
중에는 `ViewTransition` 애니메이션이 자동으로 켜집니다.

주요 prop은 이렇습니다.

| prop | 역할 |
| --- | --- |
| `name` | 공유 요소 전환용 신분. 이전 트리와 새 트리에서 같은 `name`이면 두 요소가 하나의 대상으로 이어짐. 생략하면 React가 자동 생성 |
| `enter` | 컴포넌트가 Transition 안에서 처음 삽입될 때의 애니메이션 클래스 |
| `exit` | 컴포넌트가 Transition 안에서 삭제될 때의 애니메이션 클래스 |
| `update` | 경계 내부 DOM이 변하거나 인접 요소 때문에 크기/위치가 바뀔 때 |
| `share` | 같은 `name` 쌍의 한쪽이 unmount되고 다른 쪽이 mount될 때 (enter/exit보다 우선) |
| `default` | 다른 어떤 트리거에도 해당하지 않을 때의 기본값 |

값으로는 `"auto"`(브라우저 기본 크로스페이드), `"none"`(해당 트리거에서 애니메이션
안 함), CSS 클래스 문자열, 또는 **전환 타입 → 클래스 매핑 객체**를 줄 수 있습니다.
`default="none"`이면 명시적으로 지정한 트리거 외에는 아무 애니메이션도 하지
않습니다. 클래스는 `view-transition-class`로 요소에 붙고, CSS에서는
`::view-transition-old(.클래스)` 같은 의사 요소 선택자로 받습니다.

내부 구현에서 `name`은 요소가 실제로 애니메이션에 참여할 때만 가장 가까운 자식
DOM 노드에 인라인 스타일(`view-transition-name`)로 붙습니다. 이름 충돌을 피하기
위해서입니다. 또한 React는 스크롤 복원이 올바른지 확인하려고 보류 중인
내비게이션이 끝날 때까지 기다린 뒤 애니메이션을 시작합니다.

### 4단계: 공유 요소 모프 — `name`이 만드는 동일성

모프의 원리는 단순합니다. **서로 다른 두 트리에 같은 `name`을 가진
`ViewTransition`이 각각 있으면, React와 브라우저가 두 요소를 "같은 대상의
이전/이후"로 취급합니다.** 옛 스냅샷과 새 스냅샷이 `::view-transition-image-pair`
아래 한 쌍으로 묶이고, 그룹 컨테이너가 위치와 크기를 보간하므로 "썸네일이 그대로
커지는" 움직임이 됩니다. 추가 prop 없이 `name`만 일치해도 모프는 동작합니다.

단, 짝이 성립하려면 조건이 있습니다 (React 문서 기준).

- 양쪽 요소가 **뷰포트 안**에 있어야 합니다. 하나라도 뷰포트 밖이면 짝이
  만들어지지 않고 각자의 enter/exit 애니메이션으로 되돌아갑니다.
- 옛 요소 unmount와 새 요소 mount가 **같은 Transition** 안에서 일어나야 합니다.
  목적지가 Suspense 폴백으로 먼저 표시되면 그 사이에 짝이 끊기고, 콘텐츠가
  도착했을 때는 enter 애니메이션이 대신 재생됩니다. 이 예시의 상세 페이지는
  `generateStaticParams`로 사전 렌더링되어 있어 내비게이션과 같은 커밋에서
  그려지므로 짝이 안정적으로 성립합니다.
- 동시에 마운트된 두 요소가 같은 `name`을 가지면 오류입니다.

커스터마이즈는 `share="morph"` + `default="none"` 조합으로 합니다. `share`가
모프에 `morph` 클래스를 부여하면 CSS에서 그 클래스를 받아 시간과 효과를 입힙니다.
`default="none"`은 중요 합니다 — 이게 없으면 페이지에서 아무 전환이 일어날
때마다 이름 붙은 모든 `ViewTransition`이 제 크로스페이드를 재생해 버립니다.
주의: `default="none"`을 주면서 `share`를 빼먹으면 짝은 조용히 모프를 멈춥니다.

### 5단계: 방향 슬라이드 — `transitionTypes`로 내비게이션에 태그 달기

앞으로 가는지 뒤로 오는지를 애니메이션으로 표현하려면, 내비게이션 자체에
"타입"을 붙이고 컴포넌트가 그 타입별 애니메이션을 매핑하면 됩니다.

1. `<Link>`의 `transitionTypes` prop이 내비게이션에 타입 태그를 답니다
   (예: `["nav-forward"]`). `useRouter`의 `push()`/`replace()`도 같은 prop을
   지원합니다.
2. 페이지 콘텐츠를 감싼 `<ViewTransition>`의 `enter`/`exit`가 **타입 → 클래스
   매핑 객체**를 받아, 해당 타입의 전환에서 쓸 애니메이션 클래스를 결정합니다.
3. CSS는 `::view-transition-old(.nav-forward)` / `::view-transition-new(.nav-back)`
   등으로 그 클래스들을 애니메이션합니다.

여기서 한 가지 비대칭이 있습니다. **브라우저 자체의 뒤로가기(뒤로 가기 버튼,
스와이프)는 전환 타입을 싣지 않습니다.** 타입이 없으니 `enter`/`exit` 매핑의
`default` 값이 쓰이는데, 이 예시는 `default: "none"`이라 방향 슬라이드는 재생되지
않습니다. 대신 공유 요소 모프는 타입과 무관하게 성립하므로 모프는 역방향으로도
재생됩니다. 이 예시의 "돌아가기"는 `<Link>`에 명시적으로 `nav-back` 타입을 달아
방향 슬라이드를 보장합니다.

## 코드와 함께 보는 설명

### `app/page.tsx` — 갤러리: 방향 래퍼 + 이름 붙은 썸네일

페이지 콘텐츠 전체를 방향 전환 래퍼로 감싸고, 각 썸네일에는 사진 id로
`name`을 붙입니다.

```tsx
// app/page.tsx (일부)
<ViewTransition
  enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
  exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" }}
  default="none"
>
  {/* ... */}
  <Link key={id} href={`/photo/${id}`} transitionTypes={["nav-forward"]}>
    {/* 같은 name의 ViewTransition끼리 모프됩니다 */}
    <ViewTransition name={`photo-${id}`} share="morph" default="none">
      <img src={`/photos/${id}.svg`} alt={`사진 ${id}`} /* ... */ />
    </ViewTransition>
  </Link>
```

- 바깥 `ViewTransition`은 "이 페이지가 `nav-forward`/`nav-back` 전환에서
  슬라이드한다"를 선언합니다. `default: "none"`이라 타입 없는 전환(예:
  `router.refresh()`)에서는 움직이지 않습니다.
- 안쪽 `ViewTransition`의 `name={`photo-${id}`}`가 썸네일의 신분입니다.
  상세 페이지의 같은 이름과 짝을 이룹니다.
- `Link`의 `transitionTypes={["nav-forward"]}`가 이 클릭을 "앞으로 이동"으로
  태그합니다.

### `app/photo/[id]/page.tsx` — 상세: 같은 `name`으로 짝 완성

```tsx
// app/photo/[id]/page.tsx (일부)
<ViewTransition name={`photo-${photoId}`} share="morph" default="none">
  <img src={`/photos/${photoId}.svg`} alt={`사진 ${photoId}`} /* ... */ />
</ViewTransition>
{/* ... */}
<Link href="/" transitionTypes={["nav-back"]}>
  ← 갤러리로 돌아가기 (nav-back)
</Link>
```

갤러리와 같은 `name`이므로 클릭 순간 썸네일 스냅샷과 상세 이미지 스냅샷이 한
쌍으로 묶여 모프합니다. 돌아가기 링크는 `nav-back` 타입이라 반대 방향
슬라이드가 재생됩니다. 이 페이지는 `generateStaticParams`로 1~6번 사진을 사전
렌더링해 둡니다 — 목적지가 캐시/사전 렌더 상태여야 내비게이션과 같은 커밋에서
그려져 모프 짝이 성립합니다 ( Suspense 폴백이 끼면 짝이 끊긴다는 그 조건).
페이지 전체는 갤러리와 똑같은 enter/exit 래퍼로 감싸져 있어 양방향 슬라이드가
모두 동작합니다.

래퍼는 `layout.tsx`가 아니라 각 `page.tsx`에 둡니다. 레이아웃은 내비게이션
사이에도 유지되는(persist) 컴포넌트라 그 안에서는 enter/exit 애니메이션이
일어나지 않기 때문입니다.

### `app/globals.css` — 오버레이 제어와 애니메이션 레시피

전환 오버레이 전체에 대한 한 줄짜리 안전장치:

```css
/* 전환 중에도 페이지를 클릭할 수 있게 */
::view-transition {
  pointer-events: none;
}
```

`::view-transition` 오버레이는 전환 중에 포인터 이벤트를 가로채므로, 그대로면
애니메이션 도중 클릭이 사라집니다. `pointer-events: none`으로 클릭을 실제
페이지로 통과시킵니다. 단, 이름이 붙어 전환에 참여하는 요소는 그 시간 동안
힛테스트에서 빠지므로 전환은 짧게 유지하는 것이 좋습니다.

모프 커스터마이즈 — 400ms 동안 움직이며 중간에 살짝 blur를 줍니다.

```css
/* 공유 요소 모프: 400ms, 중간에 살짝 blur */
::view-transition-group(.morph) {
  animation-duration: 400ms;
}
::view-transition-image-pair(.morph) {
  animation-name: via-blur;
}
@keyframes via-blur {
  30% { filter: blur(3px); }
}
```

blur는 스냅샷 간 보간에서 생기는 픽셀 깨짐을 가려 줍니다. 400ms는 "인지될 만큼
충분히 느리고, 직접적으로 느껴질 만큼 충분히 빠른" 지점입니다.

방향 슬라이드 — exit는 빠르게(150ms) 빠져나가고, enter는 늦게(210ms, exit
완료 후) 나타나며 이동은 400ms 걸립니다.

```css
::view-transition-old(.nav-forward) {
  --slide-offset: -60px;
  animation:
    var(--duration-exit) ease-in both vt-fade reverse,
    var(--duration-move) ease-in-out both vt-slide reverse;
}
::view-transition-new(.nav-forward) {
  --slide-offset: 60px;
  animation:
    var(--duration-enter) ease-out var(--duration-exit) both vt-fade,
    var(--duration-move) ease-in-out both vt-slide;
}
```

`nav-back`은 offset 부호만 반대입니다. 이 비대칭 타이밍이 의도적입니다 — 옛
콘텐츠는 시선을 뺏기지 않게 빨리 나가고, 새 콘텐츠는 인지할 시간을 주며
들어옵니다. `--slide-offset`의 60px은 방향을 전달하되 눈이 화면을 가로지르는
물체를 추적하지 않아도 되는 크기입니다.

마지막으로 모션 최소화 설정 존중:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
  }
}
```

방향 슬라이드는 화면을 가로지르는 움직임이라 모션 민감성 사용자에게 가장 부담이
큰 패턴입니다. 지속 시간을 0으로 만들면 브라우저 기본인 즉시 교체로 돌아갑니다.
(`ViewTransition`이 자동으로 꺼 주지 않으므로 CSS에서 직접 처리해야 합니다.)

## 정량 비교

### 애니메이션 라이브러리 vs View Transitions API

| 방식 | 비용 |
| --- | --- |
| framer-motion 등 JS 애니메이션 | 번들 추가 + JS로 매 프레임 계산 |
| View Transitions API | **브라우저 네이티브** — JS 번들 0, 합성 스레드에서 실행 |

`import { ViewTransition } from "react"`만으로 되고, CSS만 추가됩니다.
별도 설정이 필요 없습니다 (App Router가 React canary를 사용).

전환 요소가 스냅샷(비트맵)으로 캡처되어 합성되므로, 애니메이션 비용이 DOM
레이아웃/페인트가 아니라 합성 단계에서 처리됩니다. 메인 스레드가 바쁜 순간에도
전환이 끊기지 않는 이유가 이것입니다.

### 브라우저 지원

React의 통합은 View Transitions API의 최신 기능(전환 타입, `view-transition-class`)에
의존하며, Next.js 문서 기준 **Chromium 125 이상과 최신 Safari/Firefox**에서
사용할 수 있습니다. Safari는 일부 애니메이션 동작이 다를 수 있고, API 자체가
없는 브라우저에서는 전환이 애니메이션되지 않을 뿐 앱은 정상 동작합니다
(우아한 성능 저하). 기능이 아니라 점진적 향상으로 취급하면 됩니다.

## 좋은 활용 사례

- 사진/상품 상세 전환: 공유 요소 모프
- 목록↔상세 방향 슬라이드로 위계 표현
- `prefers-reduced-motion`에서 애니메이션 제거 (이 예시에 포함)
- 전환 중 클릭 먹통 방지를 위해 `::view-transition { pointer-events: none }`
- Suspense 리빌: 폴백에 `exit`, 실제 콘텐츠에 `enter`를 주면 "스켈레톤이
  밀려나고 데이터가 밀려들어 오는" 전환이 됩니다 (이 예시에는 미포함)
- 탭 전환처럼 같은 라우트 안의 내용 교체는 `key` 변경 + `share="auto"`로
  크로스페이드 (이 예시에는 미포함)

## 흔한 오해와 주의점

1. **"미지원 브라우저에서 깨진다"** — 깨지지 않습니다. 애니메이션만 재생되지
   않을 뿐 내비게이션과 콘텐츠는 정상 동작합니다. 지원 여부를 체크해서 분기할
   필요가 보통은 없습니다.
2. **"`name`은 아무 데나 같은 걸 쓰면 된다"** — 동시에 마운트된 두 요소가 같은
   `name`을 가지면 오류입니다. id를 섞어 문서 전체에서 유일하게 만드세요
   (이 예시의 `photo-${id}`).
3. **"요소를 애니메이션하면 그 안의 자식도 따라 움직인다"** — 스냅샷은 정적
   비트맵입니다. 내부 요소가 개별적으로 움직이지 않습니다. 내부 연속성이
   필요하면 그 요소에 별도 `ViewTransition`을 중첩하세요.
4. **"브라우저 뒤로가기에도 방향 슬라이드가 재생된다"** — 브라우저가 일으킨
   뒤로가기에는 전환 타입이 없습니다. `default: "none"`이라면 슬라이드는 재생되지
   않고, 타입과 무관한 공유 요소 모프만 성립합니다. 방향을 보장하려면 이
   예시처럼 `Link`에 직접 `nav-back`을 달아 주세요.
5. **"`prefers-reduced-motion`은 알아서 처리된다"** — 아닙니다. React도
   브라우저도 자동으로 꺼 주지 않습니다. 이 예시의 `globals.css`처럼 지속 시간을
   0으로 만드는 미디어 쿼리를 직접 작성해야 합니다.

## DX 개선

- 수동 mount/unmount 추적 없이 "이 요소가 이어진다"를 `name`으로 선언
- 브라우저 뒤로가기도 자동 애니메이션 (공유 요소 모프 한정 — 방향 슬라이드는
  전환 타입이 없어 재생되지 않음)
- mount/unmount 수명주기 추적, 요소 위치 기록, 타이밍 조율을 수동으로 하던
  애니메이션 라이브러리 패턴이 선언적 prop 몇 개로 대체됩니다

## 관련 문서

- [View Transitions 가이드](https://nextjs.org/docs/app/guides/view-transitions) — 이 예시가 따른 4가지 패턴의 공식 가이드
- [React ViewTransition](https://react.dev/reference/react/ViewTransition) — prop 명세와 짝 성립 조건
- [MDN: View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) — 네이티브 API와 의사 요소 트리
- [React View Transitions 데모](https://react-view-transitions-demo.labs.vercel.dev) ([소스](https://github.com/vercel-labs/react-view-transitions-demo), [전체 CSS](https://github.com/vercel-labs/react-view-transitions-demo/blob/main/src/app/globals.css))
