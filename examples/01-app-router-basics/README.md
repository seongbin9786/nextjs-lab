# 01 — App Router 기본기

> 폴더와 파일이 곧 URL이 되는 파일 시스템 라우팅. 라우터 설정 파일이 필요 없습니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 개념 | 파일 규칙 | 데모 위치 |
| --- | --- | --- |
| 페이지 | `app/**/page.tsx` | `/about`, `/blog` |
| 레이아웃 (상태 유지) | `layout.tsx` | `/dashboard` 중첩 레이아웃 |
| 템플릿 (매번 재마운트) | `template.tsx` | `/layout-vs-template` |
| 라우트 그룹 (URL에 안 나타남) | `(폴더)` | `app/(marketing)/about` → `/about` |
| 404 | `not-found.tsx` | `/no-such-page` |

## 핵심 개념

### 페이지 (`page.tsx`)
폴더 안의 `page.tsx`가 그 URL의 화면입니다. `app/about/page.tsx` → `/about`.

### 레이아웃 (`layout.tsx`)
자식 라우트가 바뀌어도 **다시 렌더링되지 않는** 공통 UI입니다. `/dashboard`와
`/dashboard/settings`를 오가며 사이드바 DOM이 유지되는지 DevTools로 확인해보세요.

### 템플릿 (`template.tsx`)
레이아웃과 같지만 **이동할 때마다 새로 마운트**됩니다. `/layout-vs-template`에서
버튼 클릭 횟수로 직접 확인할 수 있습니다 (레이아웃은 유지, 템플릿은 초기화).

### 라우트 그룹 (`(폴더)`)
괄호 폴더는 URL 세그먼트를 만들지 않습니다. 레이아웃을 그룹별로 분리하거나
URL을 건드리지 않고 코드를 조직화할 때 씁니다.

## 정량 비교: 레이아웃 재사용

| 방식 | `/dashboard/settings` 이동 시 다시 받는 UI |
| --- | --- |
| 레이아웃 없음 (SPA 일반 패턴) | 내비게이션 + 사이드바 + 페이지 전부 재렌더/전송 |
| App Router 레이아웃 | **페이지 부분만** — 레이아웃 세그먼트는 재전송·재마운트 없음 |

Next.js 16부터는 prefetch에서도 **레이아웃 중복 제거**가 적용되어, 같은
레이아웃을 공유하는 링크가 50개여도 레이아웃 데이터는 한 번만 내려받습니다.

## 좋은 활용 사례

- 사이트 공통 내비게이션/푸터 → 루트 `layout.tsx`
- 섹션별 사이드바 → 중첩 `layout.tsx`
- 페이지 진입 애니메이션처럼 매번 다시 실행해야 하는 효과 → `template.tsx`
- 마케팅/관리 영역 분리 → 라우트 그룹 `(marketing)`, `(admin)`

## DX 개선

- 라우터 설정 파일(React Router의 `<Routes>` 등)이 사라짐 — 파일 생성이 곧 라우트 등록
- 중첩 레이아웃이 코드 구조 그대로 표현됨 — 레이아웃 중첩을 수동으로 합성할 필요 없음
- `Link`가 자동으로 prefetch하여 클릭 시 즉각 전환

## 관련 문서

- [App Router 라우팅 기초](https://nextjs.org/docs/app/building-your-application/routing)
- [Pages and Layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
