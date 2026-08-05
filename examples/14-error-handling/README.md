# 14 — 에러 처리

> 에러를 라우트 세그먼트 단위로 격리합니다. 하위가 죽어도 앱 전체는 살아 있습니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

파일 규칙 3가지:

| 파일 | 역할 | 범위 |
| --- | --- | --- |
| `error.tsx` | 렌더링 중 throw된 오류를 잡는 경계 | 해당 폴더 + 하위 |
| `not-found.tsx` | `notFound()` 호출 시 UI | 해당 폴더 + 하위 |
| `global-error.tsx` | 루트 레이아웃이 무너졌을 때 최후 방어선 | 앱 전체 |

데모 페이지:

| 페이지 | 내용 |
| --- | --- |
| `/reports` | 섹션 전용 `error.tsx`가 있는 영역 |
| `/reports/crash-client` | 버튼으로 클라이언트 렌더링 중 throw |
| `/reports/crash-server` | 서버 컴포넌트에서 throw (`?crash=1`) |
| `/reports/missing` | `notFound()` → 섹션 전용 404 |
| `/global` | `global-error.tsx` 설명 |

에러 발생 위치별로 실제로 보이는 화면:

| 에러 발생 위치 | 보여지는 UI | 살아 있는 것 |
| --- | --- | --- |
| `/reports/crash-client` 렌더링 중 | `app/reports/error.tsx` | 홈, reports 레이아웃(빵부스러기) |
| `/reports/crash-server?crash=1` | `app/reports/error.tsx` (같은 경계) | 위와 동일 |
| `/reports/missing` (`notFound()`) | `app/reports/not-found.tsx` | 위와 동일 |
| 존재하지 않는 URL (`/abc` 등) | `app/not-found.tsx` (루트) | 루트 레이아웃 |
| 루트 레이아웃 자체 | `app/global-error.tsx` | 없음 — 자체 html/body로 렌더링 |

## 동작 원리

### error.tsx는 React 에러 바운더리를 자동으로 만들어 줍니다

React의 **에러 바운더리**는 자식 컴포넌트 트리에서 렌더링 중에 던져진
오류를 잡아, 무너진 트리 대신 폴백 UI를 보여주는 장치입니다. 클래스
컴포넌트의 `getDerivedStateFromError`(폴백 UI로 전환할 상태 만들기)와
`componentDidCatch`(로깅 같은 부수 효과)로 구현되는 그 메커니즘입니다.

`error.tsx`를 폴더에 두면 Next.js가 그 폴더 아래 구간에 이 바운더리를
**자동으로** 생성합니다. 수동으로 ErrorBoundary 트리를 구성할 필요가
없습니다. 경계가 감싸는 범위는 정확히 정해져 있습니다.

- 감싸는 것: 같은 폴더의 `loading.tsx`, `not-found.tsx`, `page.tsx`, 그리고
  **하위**의 중첩된 `layout.tsx`들
- 감싸지 않는 것: **같은 폴더 자기 위에 있는** `layout.tsx`, `template.tsx`

```
app/layout.tsx (루트 레이아웃)
└── app/reports/layout.tsx        ← 경계 "밖"이라 에러가 나도 살아 남음
    └── [app/reports/error.tsx 경계]   ← 여기서부터 아래를 감쌈
        ├── not-found 처리 (app/reports/not-found.tsx)
        └── page.tsx들 (crash-client / crash-server / missing / ...)
```

에러 바운더리의 본질이 **격리**입니다. 경계 안의 트리가 무너지면 그 트리만
폴백으로 교체되고, 경계 밖(상위 레이아웃, 형제 섹션)은 그대로 동작합니다.

### 에러는 가장 가까운 조상 경계로 올라갑니다

어디선가 에러가 던져지면, React는 그 지점에서 **트리 위쪽으로 올라가며
가장 가까운 에러 바운더리**를 찾습니다. 이 예시에서는
`/reports/crash-client`, `/reports/crash-server` 모두에서 던져진 에러가
`app/reports/error.tsx` 경계에 잡힙니다.

- 폴더에 `error.tsx`가 없으면 에러는 계속 위로 올라갑니다. 이 예시의
  루트(`app/`)에는 `error.tsx`가 없으므로, reports에 경계가 없었다면
  Next.js가 제공하는 기본 에러 UI(개발 모드에서는 에러 위치와 코드를
  보여주는 오버레이)가 대신 표시됩니다.
- 반대로 `error.tsx` 자신이 렌더링 중 throw하면 그 에러는 **부모 경계로
  계속 올라갑니다.** 에러 UI가 실패해도 앱 전체가 흰 화면이 되지 않도록
  하는 안전장치입니다.

### 클라이언트 에러 처리 흐름

`/reports/crash-client`에서 일어나는 일을 순서대로 보면 이렇습니다.

```
① 사용자가 버튼 클릭
② onClick: setShouldThrow(true)        ← 핸들러 안에서는 throw하지 않음
③ 상태 변경 → 다시 렌더링
④ CrashButton이 렌더링 도중 throw
⑤ app/reports/error.tsx 경계가 잡음 (React 바운더리 메커니즘)
⑥ 경계 아래 트리만 에러 UI로 교체
⑦ reports 레이아웃(빵부스러기)과 홈은 그대로 생존
```

여기서 ②가 중요합니다. React 에러 바운더리는 **렌더링, 라이프사이클,
자식의 생성자**에서 던져진 에러만 잡고, **이벤트 핸들러나 비동기 코드에서
던져진 에러는 잡지 못합니다.** 이벤트 핸들러는 렌더링이 끝난 뒤에 실행되기
때문입니다. 그래서 `components/crash-button.tsx`는 핸들러 안에서 throw하지
않고 상태를 바꿔서 **그다음 렌더링에서** throw합니다.

참고로 `useTransition`의 `startTransition` 안에서 처리되지 않은 에러는
예외적으로 가장 가까운 에러 바운더리로 올라갑니다.

경계가 잡은 뒤 복구 수단은 props로 들어옵니다.

- `reset()`: 에러 상태를 지우고 경계의 children을 다시 렌더링합니다.
  원인이 사라졌다면(일시적 데이터 문제 등) 그대로 복구됩니다.
- `retry()`: Next.js 16.3에서 안정화된 prop으로, 세그먼트를
  **다시 fetch하고 다시 렌더링**합니다. 대부분의 경우에는 재시도가
  데이터까지 다시 가져오는 `retry()` 쪽이 더 적절합니다.

### 서버 에러 처리 흐름

`/reports/crash-server?crash=1`은 다른 경로를 걷지만 **결과는 같은
`error.tsx`**입니다.

```
① 요청 도착 → 서버에서 page.tsx 렌더링 시작
   (async 서버 컴포넌트, searchParams를 읽으므로 매 요청 렌더링)
② crash === "1" → 서버에서 throw new Error(...)
③ React 바운더리는 서버 렌더링 단계의 에러를 직접 잡지 않음
   → Next.js가 서버 쪽에서 throw를 잡아 처리:
   ㄱ. 전체 에러(스택 트레이스 포함)는 서버 로그에만 기록
   ㄴ. 해당 경계의 error.tsx 폴백을 렌더링해 응답에 포함
   ㄷ. 클라이언트에는 일반화된 에러 + digest만 전달
④ 브라우저에는 app/reports/error.tsx UI가 표시됨
```

중요한 차이 두 가지입니다.

- **클라이언트 에러**는 원래의 `Error` 객체가 그대로 경계에 전달됩니다.
  `error.message`가 보이는 이유가 이것입니다.
- **서버 에러**는 민감한 정보가 새는 것을 막기 위해 원본 메시지가
  전달되지 않습니다. 대신 **digest**(자동 생성된 해시)가 붙어 나오고,
  이 digest로 서버 로그의 해당 에러와 짝을 맞춥니다. 개발 모드에서는
  디버깅을 위해 원본 메시지가 직렬화되어 함께 전달됩니다.

이 페이지는 `searchParams`를 await으로 읽기 때문에 매 요청 동적으로
렌더링됩니다. 그래서 빌드 단계에서는 throw가 실행되지 않아 빌드가
깨지지 않습니다.

### global-error.tsx가 루트 레이아웃을 대체하는 이유

일반 `error.tsx`는 **루트 레이아웃 안쪽**에 렌더링됩니다. 그런데 루트
레이아웃 자체가 에러를 던지면, 에러 UI를 감쌀 껍데기 자체가 사라집니다.
이 최후의 케이스를 위해 `global-error.tsx`가 있습니다.

- `global-error.tsx`는 작동할 때 **루트 레이아웃(또는 template)을
  통째로 대체**합니다.
- 그래서 반드시 **자체 `<html>`과 `<body>`**를 직접 렌더링해야 합니다.
  이 예시의 `app/global-error.tsx`가 인라인 스타일로 `<html>`/`<body>`를
  그리는 이유가 이것입니다.
- 전역 스타일, 폰트, 외부 스크립트가 하나도 로드되지 않은 "맨몸"
  상태입니다. 최소한의 인라인 스타일과 digest 표시, 다시 시도 버튼만
  두는 것이 일반적입니다.
- 클라이언트 컴포넌트여야 하므로 `metadata` export가 지원되지 않습니다.
  타이틀이 필요하면 React의 `<title>` 컴포넌트를 사용합니다.

이 예시에서는 홈과 내비게이션을 유지한 채 섹션 단위 에러를 보여주는 데
초점을 맞춰 루트 레이아웃을 실제로 망가뜨리지는 않습니다. 직접 확인하려면
`app/layout.tsx`의 `{children}` 위에 임시로 `throw new Error("테스트")`를
넣고 아무 페이지나 새로고침하면 전체 화면이 `global-error.tsx`로
바뀝니다.

### not-found.tsx가 트리거되는 두 경로

`not-found.tsx`는 두 가지 상황에서 렌더링됩니다.

1. **존재하지 않는 라우트**: 어떤 라우트와도 매칭되지 않는 URL이
   요청되면 **루트** `app/not-found.tsx`가 앱 전체의 404 화면을
   담당합니다.
2. **`notFound()` 호출**: 라우트 세그먼트 안에서 `notFound()`를 호출하면
   그 지점에서 **가장 가까운** `not-found.tsx`가 렌더링됩니다. 이
   예시에서는 `/reports/missing`이 `notFound()`를 호출하고, 루트보다
   가까운 `app/reports/not-found.tsx`가 표시됩니다.

세부 동작:

- `not-found.tsx`는 같은 세그먼트에서 `loading.tsx`와 `page.tsx` 사이에
  렌더링되며, 기본값은 서버 컴포넌트입니다(async로 만들어 데이터를
  가져올 수도 있습니다).
- HTTP 상태 코드는 일반적인(스트리밍이 아닌) 응답에서는 **404**가
  나갑니다. 다만 스트리밍 응답은 이미 200으로 응답이 시작된 뒤라 200이
  될 수 있습니다.
- "데이터 없음"을 표현하는 표준 방법입니다. `throw new Error("없음")`
  대신 `notFound()`를 쓰면 에러 경계가 아니라 404 UI가 나갑니다.

### 프로덕션에서 에러 상세가 숨겨지는 이유

에러 메시지와 스택 트레이스에는 SQL 조각, 파일 경로, 내부 API 구조 같은
민감한 정보가 섞이기 쉽습니다. 그래서 환경별로 동작이 다릅니다.

| 환경 | 서버에서 넘어오는 에러 |
| --- | --- |
| 개발 모드 | 원본 `message`까지 직렬화되어 전달 (디버깅용 오버레이 포함) |
| 프로덕션 | 일반화된 메시지 + `digest` 해시만 전달 |

프로덕션에서는 사용자가 보는 화면에 digest만 보여 주고, 실제 원인 분석은
digest로 서버 로그를 매칭해서 하는 것이 표준 흐름입니다. 이 예시의
`app/reports/error.tsx`도 이 내용을 주석으로 담아 두었습니다. 주의할 점:
**클라이언트 컴포넌트에서 던진 에러**는 원래 메시지가 그대로 표시될 수
있습니다. 클라이언트 코드에서 throw하는 메시지에도 민감한 값을 담지
말아야 합니다.

## 코드와 함께 보는 설명

### `app/reports/error.tsx` — 섹션 전용 경계

```tsx
"use client";

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // error.message / error.digest 표시 + reset() 버튼 렌더링
}
```

`error.tsx`는 반드시 클라이언트 컴포넌트여야 합니다. 에러 바운더리는
브라우저의 React 기능이므로 서버 컴포넌트로 만들 수 없습니다.

### `components/crash-button.tsx` — 렌더링 중 throw의 정석

```tsx
"use client";

export function CrashButton() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // 렌더링 중에 던져야 에러 경계가 잡습니다.
  // (이벤트 핸들러 안의 throw는 경계가 잡지 못합니다.)
  if (shouldThrow) {
    throw new Error("클라이언트 렌더링 중 발생한 데모 오류");
  }
  return <button onClick={() => setShouldThrow(true)}>렌더링 중 오류 던지기</button>;
}
```

핸들러에서는 상태만 바꾸고, throw는 그다음 렌더링에서 일어납니다.

### `app/reports/crash-server/page.tsx` — 서버에서 throw

```tsx
export default async function CrashServerPage({
  searchParams,
}: {
  searchParams: Promise<{ crash?: string }>;
}) {
  const { crash } = await searchParams;
  if (crash === "1") {
    throw new Error("서버 렌더링 중 발생한 데모 오류");
  }
  // ...
}
```

서버에서 던져져도 사용자에게는 같은 `app/reports/error.tsx`가 보입니다.

### `app/reports/missing/page.tsx` + `not-found.tsx` 두 개

```tsx
// app/reports/missing/page.tsx
import { notFound } from "next/navigation";
export default function MissingPage() {
  notFound();
}
```

`app/reports/not-found.tsx`(섹션 전용)가 루트 `app/not-found.tsx`보다
우선합니다. 루트 쪽은 매칭되지 않는 URL 전체의 폴백입니다.

### `app/global-error.tsx` — 최후 방어선

자체 `<html>`/`<body>`와 인라인 스타일, digest 표시, 다시 시도 버튼을
가진 최소 화면입니다. 전역 스타일이 로드되지 않는 상태에서도 읽을 수
있어야 하므로 배경색·글자색까지 직접 지정합니다.

### `app/reports/layout.tsx` — 경계 밖에서 살아 남는 레이아웃

빵부스러기 내비게이션을 그리는 이 레이아웃은 `error.tsx` 경계보다 위에
있어서, 하위 페이지가 무너져도 화면에 계속 남아 있습니다. 세그먼트 격리의
효과를 눈으로 확인하는 장치입니다.

## 정량 비교: 전역 try/catch vs 세그먼트 경계

| 방식 | 상품 페이지 1개 오류 시 |
| --- | --- |
| SPA 전역 ErrorBoundary | 앱 전체가 에러 화면 |
| App Router 세그먼트 경계 | **해당 섹션만** 교체, 나머지 정상 |

범위를 좁혀서 비교하면 차이가 더 선명합니다.

| 에러 경계 배치 | `/reports/crash-client` 실패 시 사용자가 잃는 화면 |
| --- | --- |
| 최상위 1개만 | 앱 전체 (홈, 내비게이션 포함) |
| `app/reports/error.tsx` (이 예시) | reports 하위 콘텐츠만 — 홈과 빵부스러기 내비게이션은 그대로 |
| 각 page 폴더마다 | 실패한 그 페이지만 |

경계를 세밀하게 배치할수록 사용자가 한 번의 장애로 잃는 화면이 줄어듭니다.
대신 경계마다 폴백 UI가 필요하니, 외부 의존이 있는 섹션(차트, 결제 위젯,
서드파티 임베드) 위주로 배치하는 것이 실용적입니다.

## 좋은 활용 사례

- 외부 데이터 의존 섹션(차트, 결제 위젯)마다 `error.tsx`
- 프로덕션에서 `error.message`는 노출하지 말고 `digest`만 로깅 연동
- `notFound()`는 "데이터 없음"의 표준 표현 (404 상태 코드 자동)
- 일시적 장애가 많으면 폴백에 `retry()`/`reset()` 버튼을 반드시 두기 —
  사용자가 새로고침하지 않고도 복구됩니다
- 개발 중에는 React DevTools에서 에러 바운더리를 강제로 켜서 에러 상태를
  테스트할 수 있습니다

## DX 개선

- 경계 배치가 폴더 구조 그대로 — ErrorBoundary 트리 수동 구성 없음
- 서버/클라이언트 에러를 같은 파일(`error.tsx`)에서 처리
- 개발 모드 오버레이가 에러 위치와 코드를 바로 표시

## 흔한 오해와 주의점

1. **"error.tsx는 모든 에러를 잡는다"** — 렌더링 중 에러만 잡습니다.
   이벤트 핸들러, `setTimeout` 같은 비동기 코드에서 던져진 에러는 경계가
   잡지 못하니 `try/catch` + 상태로 직접 처리해야 합니다. (예외:
   `startTransition` 안 에러는 경계로 올라갑니다.)
2. **"에러가 나면 앱 전체가 에러 화면이 된다"** — 가장 가까운 경계의
   **하위 트리만** 교체됩니다. 이 예시에서 홈과 내비게이션이 살아 남는
   것이 그 증거입니다.
3. **"프로덕션에서도 error.message가 보일 것이다"** — 서버 에러는
   일반화된 메시지와 digest만 클라이언트에 도달합니다. 개발 모드에서만
   원본 메시지가 직렬화되어 옵니다.
4. **"error.tsx를 서버 컴포넌트로 써도 된다"** — 에러 바운더리는 브라우저의
   React 기능이므로 반드시 `"use client"` 클라이언트 컴포넌트여야 합니다.
   `global-error.tsx`도 마찬가지입니다.
5. **"not-found는 항상 404 상태 코드를 돌려준다"** — 일반 응답은 404지만,
   스트리밍 응답은 이미 200으로 시작된 뒤라 200일 수 있습니다. SEO가
   중요한 경로라면 이 차이를 알고 있어야 합니다.

## 관련 문서

- [Error Handling](https://nextjs.org/docs/app/getting-started/error-handling)
- [error.js 파일 규칙](https://nextjs.org/docs/app/api-reference/file-conventions/error)
- [not-found.js 파일 규칙](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- [notFound() 함수](https://nextjs.org/docs/app/api-reference/functions/not-found)
- [에러 바운더리 원리 (React 공식 문서)](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
