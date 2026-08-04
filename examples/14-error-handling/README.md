# 14 — 에러 처리

> 에러를 라우트 세그먼트 단위로 격리합니다. 하위가 죽어도 앱 전체는 살아 있습니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 파일 규칙 3가지

| 파일 | 역할 | 범위 |
| --- | --- | --- |
| `error.tsx` | 렌더링 중 throw된 오류를 잡는 경계 | 해당 폴더 + 하위 |
| `not-found.tsx` | `notFound()` 호출 시 UI | 해당 폴더 + 하위 |
| `global-error.tsx` | 루트 레이아웃이 무너졌을 때 최후 방어선 | 앱 전체 |

## 이 예시 데모

| 페이지 | 내용 |
| --- | --- |
| `/reports` | 섹션 전용 `error.tsx`가 있는 영역 |
| `/reports/crash-client` | 버튼으로 클라이언트 렌더링 중 throw |
| `/reports/crash-server` | 서버 컴포넌트에서 throw (`?crash=1`) |
| `/reports/missing` | `notFound()` → 섹션 전용 404 |
| `/global` | `global-error.tsx` 설명 |

## 핵심 개념

### error.tsx는 반드시 클라이언트 컴포넌트

```tsx
"use client";
export default function ReportsError({ error, reset }) {
  return (
    <div>
      {error.message}
      <button onClick={() => reset()}>다시 시도</button>
    </div>
  );
}
```

에러 경계는 브라우저의 React 기능이므로 서버 컴포넌트로 만들 수 없습니다.
`reset()`은 경계 안을 다시 렌더링해 일시적 오류에서 복구합니다.

### 격리의 범위

`/reports/crash-client`에서 에러가 나도 **홈·내비게이션은 그대로**입니다.
경계가 `/reports`에 있어서 그 섹션만 교체됩니다.

### global-error.tsx

루트 레이아웃 자체가 망가지면 일반 `error.tsx`도 렌더링할 수 없습니다
(루트 레이아웃을 경유해야 하므로). 그래서 `global-error.tsx`는
**자체 `<html>/<body>`**를 직접 그립니다.

## 정량 비교: 전역 try/catch vs 세그먼트 경계

| 방식 | 상품 페이지 1개 오류 시 |
| --- | --- |
| SPA 전역 ErrorBoundary | 앱 전체가 에러 화면 |
| App Router 세그먼트 경계 | **해당 섹션만** 교체, 나머지 정상 |

## 좋은 활용 사례

- 외부 데이터 의존 섹션(차트, 결제 위젯)마다 `error.tsx`
- 프로덕션에서 `error.message`는 노출하지 말고 `digest`만 로깅 연동
- `notFound()`는 "데이터 없음"의 표준 표현 (404 상태 코드 자동)

## DX 개선

- 경계 배치가 폴더 구조 그대로 — ErrorBoundary 트리 수동 구성 없음
- 서버/클라이언트 에러를 같은 파일(`error.tsx`)에서 처리
- 개발 모드 오버레이가 에러 위치와 코드를 바로 표시

## 관련 문서

- [Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
