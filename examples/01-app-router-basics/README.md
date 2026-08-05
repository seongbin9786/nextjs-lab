# 01 — App Router 기본기

> 폴더와 파일이 곧 URL이 되는 파일 시스템 라우팅. 라우터 설정 파일이 필요 없습니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

홈(`/`)에서 각 개념으로 가는 링크를 제공합니다. 직접 확인해볼 지점은 이렇습니다.

- `/dashboard` ↔ `/dashboard/settings` — 사이드바 DOM과 입력값이 유지되는지
- `/layout-vs-template` — 레이아웃(초록 테두리)과 템플릿(주황 점선) 중 누가 살아남는지
- `/about`, `/blog` — `(marketing)` 라우트 그룹이 URL에서 생략되는지
- `/no-such-page` — `app/not-found.tsx` 폴백 화면

## 이 예시가 보여주는 것

| 개념 | 파일 규칙 | 데모 위치 |
| --- | --- | --- |
| 페이지 | `app/**/page.tsx` | `/about`, `/blog` |
| 레이아웃 (상태 유지) | `layout.tsx` | `/dashboard` 중첩 레이아웃 |
| 템플릿 (매번 재마운트) | `template.tsx` | `/layout-vs-template` |
| 라우트 그룹 (URL에 안 나타남) | `(폴더)` | `app/(marketing)/about` → `/about` |
| 404 | `not-found.tsx` | `/no-such-page` |
| 자동 prefetch (프로덕션 빌드) | `<Link>` | 모든 페이지 이동 |

## 동작 원리

### 1. 빌드 시: 폴더 구조가 라우트 정의가 됩니다

Next.js는 빌드(또는 `next dev` 시작) 시점에 `app/` 디렉터리를 읽어 라우트를 구성합니다. 규칙은 세 가지입니다.

- **폴더 = URL 세그먼트.** 폴더가 URL 세그먼트를 만들고, 폴더를 중첩하면 URL도 중첩됩니다.
- **예약 파일만 라우팅에 참여.** `page`, `layout`, `template`, `loading`, `error`, `not-found` 같은 예약된 이름만 라우팅에 쓰입니다. 그 외 파일(컴포넌트, 데이터, 테스트)은 라우트 폴더 안에 함께 있어도 URL에 영향을 주지 않습니다 (colocation).
- **`page.tsx`(또는 `route.ts`)가 있어야 공개 라우트.** 폴더만 만들어서는 URL이 생기지 않습니다. `page.tsx`나 `route.ts` 파일이 있는 폴더만 외부에서 접근 가능한 라우트가 됩니다.

이 예시의 파일 구조와 URL 대응입니다.

```text
app/
├── layout.tsx                           ← 루트 레이아웃 (필수, 모든 라우트 공유)
├── page.tsx                             → /
├── not-found.tsx                        ← 매칭 실패 시 폴백
├── (marketing)/                         ← 라우트 그룹: URL 세그먼트 없음
│   ├── about/page.tsx                   → /about
│   └── blog/
│       ├── page.tsx                     → /blog
│       ├── file-system-routing/page.tsx → /blog/file-system-routing
│       └── colocation/page.tsx          → /blog/colocation
├── dashboard/
│   ├── layout.tsx                       ← /dashboard 아래 공통 사이드바
│   ├── page.tsx                         → /dashboard
│   └── settings/page.tsx                → /dashboard/settings
└── layout-vs-template/
    ├── layout.tsx                       ← 초록 테두리 (상태 유지)
    ├── template.tsx                     ← 주황 점선 테두리 (재마운트)
    ├── page.tsx                         → /layout-vs-template
    └── second/page.tsx                  → /layout-vs-template/second
```

괄호 폴더 `(marketing)`은 URL을 만드는 단계에서 통째로 건너뛰어집니다. 그래서
`app/(marketing)/about/page.tsx`의 주소는 `/marketing/about`이 아니라 `/about`입니다.

### 2. 요청 시: URL을 세그먼트 단위로 매칭합니다

URL 경로는 세그먼트의 나열입니다. App Router에서 각 세그먼트는 **정적**(정확한 값만
매칭)이거나 **동적**(자리표, 02 예시에서 다룹니다)인데, 이 예시에는 전부 정적
세그먼트뿐입니다.

`GET /dashboard/settings`가 들어왔을 때 매칭 과정은 이렇습니다.

1. 라우터가 경로를 `["dashboard", "settings"]` 세그먼트로 나눕니다.
2. `app/dashboard` 폴더(정적 매칭) → `app/dashboard/settings` 폴더(정적 매칭).
3. 해당 폴더에 `page.tsx`가 있으면 매칭 성공입니다.
4. 어느 단계에서든 해당하는 폴더나 `page.tsx`가 없으면(예: `/no-such-page`) 가장
   가까운 `not-found.tsx`를 렌더링하고 HTTP 404를 응답합니다.

### 3. 렌더 트리 구성: 폴더 계층대로 감쌉니다

매칭에 성공하면 Next.js는 폴더 계층을 따라 컴포넌트 트리를 만듭니다. 레이아웃은
자식을 `children` prop으로 받으며 중첩됩니다.

```text
/dashboard/settings 의 렌더 트리

<RootLayout>              app/layout.tsx               (<html>, <body>, TopNav)
  └─ <DashboardLayout>    app/dashboard/layout.tsx     (사이드바 + 본문 그리드)
       └─ <SettingsPage>  app/dashboard/settings/page.tsx
```

한 세그먼트 안에서 특별 파일들이 렌더링되는 순서(컴포넌트 계층)는 정해져 있습니다.

```text
layout → template → error → loading → not-found → page
```

즉 `template.tsx`는 같은 폴더의 `layout.tsx`를 감싸지 않고, 레이아웃 **안쪽**에서
`page`와 `error`, `loading`, `not-found`를 감쌉니다. 이 순서는 아래 7절에서
template을 설명할 때 다시 등장합니다.

### 4. 서버가 만드는 것: RSC 페이로드와 HTML

레이아웃과 페이지는 기본적으로 서버 컴포넌트입니다. 서버에서 일어나는 일은 이렇습니다.

1. 렌더링은 라우트 세그먼트(layout, page) 단위로 나뉘어 진행됩니다.
2. 서버 컴포넌트의 렌더 결과는 **RSC 페이로드**(React Server Component Payload)라는
   형태가 됩니다. RSC 페이로드에 들어 있는 것은 다음 세 가지입니다.
   - 서버 컴포넌트의 렌더 결과
   - 클라이언트 컴포넌트가 그려질 자리 + 해당 컴포넌트의 자바스크립트 파일 참조
   - 서버 컴포넌트에서 클라이언트 컴포넌트로 넘긴 props
3. RSC 페이로드와 클라이언트 컴포넌트를 조합해 **HTML**을 미리 렌더링(prerender)합니다.

**빌드 시 vs 요청 시** — 이 예시의 페이지는 `cookies()`, `headers()`처럼 요청이 와야
알 수 있는 값을 전혀 쓰지 않습니다. 그래서 전부 정적 라우트가 되어 프로덕션 빌드 때
HTML과 RSC 페이로드가 미리 만들어집니다(prerendering). 요청 시에는 저장된 결과를
그대로 보내면 됩니다. 반대로 동적 라우트는 매 요청 서버에서 RSC 페이로드를 새로
만듭니다(02 예시의 `/products/[id]`가 그렇습니다).

```text
서버                                   브라우저
┌──────────────────────────┐          ┌───────────────────────────┐
│ 세그먼트별 렌더링          │          │                           │
│   ↓                      │   HTML   │ 1. HTML로 즉시 화면을 그림  │
│ RSC 페이로드 생성          │ ───────→ │ 2. RSC 페이로드로 트리 조합  │
│   ↓                      │   RSC    │ 3. JS로 하이드레이션         │
│ HTML prerender           │   + JS   │    (TopNav, MountStamp)   │
└──────────────────────────┘          └───────────────────────────┘
```

### 5. 브라우저가 처리하는 순서

**첫 방문**에는 세 단계로 처리합니다.

1. **HTML**로 인터랙션 없는 화면을 즉시 그립니다.
2. **RSC 페이로드**로 서버·클라이언트 컴포넌트 트리를 맞춰봅니다(reconcile).
3. **자바스크립트**가 클라이언트 컴포넌트를 하이드레이션합니다. 하이드레이션은 정적
   HTML에 이벤트 핸들러를 연결해 인터랙티브하게 만드는 과정입니다. 이 예시에서는
   `TopNav`(`usePathname`)와 `MountStamp`(`useState`)가 이때 살아납니다.

**첫 방문 이후 이동**부터는 HTML 전체를 다시 받지 않습니다. RSC 페이로드를 미리
받아(prefetch) 캐시에 두고, 클라이언트 컴포넌트는 서버에서 만든 HTML 없이 전적으로
클라이언트에서 렌더링됩니다.

### 6. `<Link>`를 누르면: 클라이언트 전환

`<Link>`는 `<a>`를 확장한 컴포넌트로, 클릭 시 전체 페이지 새로고침 대신 **클라이언트
전환**을 수행합니다. 공식 문서가 설명하는 순서는 이렇습니다.

1. **prefetch**: 링크가 뷰포트에 들어오면(스크롤로 나타난 경우 포함) 대상 라우트를
   백그라운드에서 미리 받아 둡니다. 정적 라우트는 전체(모든 데이터 포함)를, 동적
   라우트는 건너뛰거나 `loading.tsx` 경계까지만 부분적으로 받아옵니다. prefetch는
   **프로덕션 빌드에서만** 동작합니다.
2. **전환**: 클릭하면 공유하는 레이아웃과 UI는 그대로 유지하고, 페이지 부분만 미리
   받아 둔 결과(또는 새 페이지)로 교체합니다. `/dashboard` → `/dashboard/settings`
   이동이라면 루트 레이아웃과 대시보드 레이아웃은 재전송·재마운트 없이 그대로 있고
   `page` 세그먼트만 바뀝니다.
3. **Next.js 16 — 레이아웃 중복 제거와 증분 prefetch**: 여러 링크가 같은 레이아웃을
   공유하면 레이아웃은 한 번만 내려받습니다. 상품 링크 50개가 같은 레이아웃을
   공유한다면 레이아웃 데이터를 50번이 아니라 한 번만 전송합니다. 캐시에 없는 부분만
   골라 받는 증분 prefetch도 함께 적용됩니다. 링크가 뷰포트를 벗어나면 prefetch
   요청을 취소하고, 호버하면 우선순위를 높이며, 데이터가 무효화되면 다시 받아옵니다.

### 7. layout vs template: 같은 자리, 다른 수명

`template.tsx`는 렌더 트리에서 레이아웃 바로 안쪽에 자리 잡지만, 자동으로 **고유한
key**를 받습니다. 공식 문서의 단순화 그림은 이렇습니다.

```tsx
<Layout>
  {/* 템플릿은 자동으로 고유한 key를 받습니다 */}
  <Template key={routeParam}>{children}</Template>
</Layout>
```

React에서 key가 바뀌면 기존 인스턴스를 버리고 새 인스턴스를 마운트합니다. 레이아웃은
key 없이 자리를 지키기 때문에 상태가 유지되고, 템플릿은 key가 달라질 때마다 통째로
다시 마운트됩니다.

**level 개념**: 템플릿의 key는 자기 세그먼트 레벨을 기준으로 만들어집니다.

- 자기 레벨의 세그먼트(동적 파라미터 포함)가 바뀌면 그 템플릿은 재마운트됩니다.
- 더 깊은 하위 세그먼트로만 이동하면 상위 레벨 템플릿은 재마운트되지 않습니다.
- `searchParams` 변화는 재마운트를 일으키지 않습니다.

이 예시에서 `/layout-vs-template` ↔ `/layout-vs-template/second` 이동은
`layout-vs-template` 레벨의 자식 세그먼트가 바뀌는 경우입니다. 그래서
`DemoTemplate`(주황 점선)은 key가 바뀌어 재마운트되고, `DemoLayout`(초록 테두리)은
그대로 살아남습니다. `MountStamp`의 마운트 시각과 클릭 횟수가 초기화되는 쪽이
템플릿, 유지되는 쪽이 레이아웃입니다.

부가 차이 하나: 레이아웃 안의 Suspense 폴백은 첫 로딩에서만 보이지만, 템플릿 안의
폴백은 매 이동마다 다시 보입니다.

## 코드와 함께 보는 설명

### `app/layout.tsx` — 루트 레이아웃

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <TopNav />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
```

- 루트 레이아웃은 **필수**이며 `<html>`과 `<body>`를 반드시 포함해야 합니다.
- `{children}` 자리에 폴더 계층에 따라 하위 레이아웃 또는 페이지가 들어옵니다.
- 같은 파일의 `metadata`에 `title: { template: "%s | App Router 기본기" }`를 선언해
  두었습니다. 각 페이지가 `title: "소개"`처럼 자기 제목만 선언하면 `%s` 자리에
  조립되어 `소개 | App Router 기본기`가 됩니다.
- 서버 컴포넌트이므로 여기서 데이터를 가져와 자식에게 흘려보낼 수도 있습니다.

### `components/top-nav.tsx` — 레이아웃 안의 클라이언트 컴포넌트

```tsx
// components/top-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav() {
  const pathname = usePathname();
  // pathname이 "/"면 완전 일치, 그 외에는 시작 여부로 활성 링크 판정
```

- `usePathname()`은 클라이언트 훅이라 이 파일에는 `"use client"`가 붙습니다.
- 중요한 점은 `TopNav`가 클라이언트 컴포넌트라고 레이아웃 전체가 클라이언트가 되는
  것은 아니라는 것입니다. `"use client"` 경계는 그 파일과 그것이 import하는 모듈까지만
  클라이언트 번들에 포함시킵니다. `app/layout.tsx`는 서버 컴포넌트로 남고, RSC
  페이로드에는 TopNav가 그려질 자리와 JS 파일 참조만 담깁니다.

### `app/(marketing)/about/page.tsx` — 라우트 그룹

```tsx
// app/(marketing)/about/page.tsx
// 이 파일의 실제 경로는 app/(marketing)/about/page.tsx 지만
// URL은 /about 입니다. 괄호 폴더 (marketing)은 URL에 포함되지 않습니다.
export default function AboutPage() { ... }
```

라우트 그룹의 쓰임새는 크게 세 가지입니다.

- **레이아웃 분리**: `(marketing)`과 `(shop)` 그룹마다 다른 `layout.tsx`를 둡니다.
  그룹 레이아웃은 루트 레이아웃 아래에 중첩됩니다.
- **조직화**: URL은 그대로 두고 코드만 팀·도메인별로 정리합니다.
- **세그먼트 충돌 회피**: 두 그룹에서 같은 이름의 폴더를 써도 URL이 겹치지 않습니다.

참고로 루트의 `layout.tsx`를 없애고 그룹마다 루트 레이아웃을 두면 완전히 분리된 여러
루트 레이아웃도 만들 수 있습니다.

### `app/(marketing)/blog/` — colocation

`app/(marketing)/blog/page.tsx`는 페이지 전용 데이터(`posts` 배열)를 같은 파일 안에
둡니다. 라우트 폴더에는 `page.tsx`만 둘 수 있는 것이 아닙니다. 예약 파일만 라우팅에
참여하고, 그 외 파일(컴포넌트, 데이터, 테스트)은 같은 폴더에 살아도 URL에 영향을
주지 않습니다. 명시적으로 라우팅에서 제외하고 싶다면 `_폴더`처럼 밑줄로 시작하는
비공개 폴더를 쓰면 됩니다.

### `app/dashboard/layout.tsx` — 중첩 레이아웃

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 24 }}>
      <aside className="card">…사이드바…</aside>
      <section>{children}</section>
    </div>
  );
}
```

- `{children}`에는 `/dashboard`에서는 `DashboardPage`가, `/dashboard/settings`에서는
  `SettingsPage`가 들어옵니다. 이동 시 레이아웃 컴포넌트 자체는 다시 렌더링되지 않고
  자식만 갈아끼워집니다.
- `app/dashboard/settings/page.tsx`에는 `<input>`이 하나 있습니다. 탭을 오가면 입력값이
  사라지는데, 페이지는 매번 새로 렌더링되기 때문입니다. 값을 유지하려면 상태를
  레이아웃 쪽으로 올려야 합니다.

### `app/layout-vs-template/` — 레이아웃과 템플릿의 비교 장치

```tsx
// components/mount-stamp.tsx
export function MountStamp({ label }: { label: string }) {
  const [mountedAt] = useState(() => new Date().toLocaleTimeString("ko-KR"));
  const [count, setCount] = useState(0);
  // 새로 마운트되면 마운트 시각과 클릭 횟수가 초기화됩니다.
```

- `useState` 초기화는 마운트 시점에 한 번만 실행됩니다. 그래서 마운트 시각과 클릭
  횟수가 "측정 도구" 역할을 합니다. 값이 초기화되었다는 것은 컴포넌트가 재마운트되었다는
  직접 증거입니다.
- `layout.tsx`는 초록 실선 테두리, `template.tsx`는 주황 점선 테두리를 그려 시각적으로
  구분했습니다. 같은 폴더에 둘이 함께 있으면 템플릿이 레이아웃 안쪽에 자리 잡습니다.
- `second/page.tsx`는 내용이 거의 없는 두 번째 페이지로, 이동 자체를 만드는 역할입니다.

### `app/not-found.tsx` — 전체 앱 폴백

매칭되는 `page.tsx`가 없는 주소(`/no-such-page`)나 코드에서 `notFound()`를 호출한
자리에 렌더링됩니다. 이 예시는 루트에만 두어 앱 전체가 하나의 404 화면을 공유합니다.
섹션별로 다른 404를 보여주고 싶다면 해당 섹션 폴더에 `not-found.tsx`를 추가하면 가장
가까운 경계로 잡힙니다(02 예시에서 원리를 자세히 다룹니다).

## 핵심 개념

### 페이지 (`page.tsx`)

폴더 안의 `page.tsx`가 그 URL의 화면입니다. `app/about/page.tsx` → `/about`.
`page.tsx`가 있어야 그 폴더가 공개 라우트가 됩니다.

### 레이아웃 (`layout.tsx`)

자식 라우트가 바뀌어도 **다시 렌더링되지 않는** 공통 UI입니다. 공식 문서의 표현대로
이동 시 상태를 유지하고, 인터랙티브하게 남으며, 재렌더링되지 않습니다. `/dashboard`와
`/dashboard/settings`를 오가며 사이드바 DOM이 유지되는지 DevTools로 확인해보세요.

### 템플릿 (`template.tsx`)

레이아웃과 같지만 **이동할 때마다 새로 마운트**됩니다. 정확히는 자기 세그먼트 레벨의
key가 바뀔 때 새로 마운트됩니다. `/layout-vs-template`에서 버튼 클릭 횟수로 직접
확인할 수 있습니다 (레이아웃은 유지, 템플릿은 초기화).

### 라우트 그룹 (`(폴더)`)

괄호 폴더는 URL 세그먼트를 만들지 않습니다. 레이아웃을 그룹별로 분리하거나 URL을
건드리지 않고 코드를 조직화할 때 씁니다.

## 정량 비교: 레이아웃 재사용

| 방식 | `/dashboard/settings` 이동 시 다시 받는 UI |
| --- | --- |
| 레이아웃 없음 (SPA 일반 패턴) | 내비게이션 + 사이드바 + 페이지 전부 재렌더/전송 |
| App Router 레이아웃 | **페이지 부분만** — 레이아웃 세그먼트는 재전송·재마운트 없음 |

Next.js 16부터는 prefetch에서도 **레이아웃 중복 제거**가 적용되어, 같은
레이아웃을 공유하는 링크가 50개여도 레이아웃 데이터는 한 번만 내려받습니다.
여기에 증분 prefetch가 더해져 캐시에 없는 부분만 요청합니다. 트레이드오프로
prefetch 요청 개수는 늘어날 수 있지만 총 전송량은 크게 줄어듭니다.

## 좋은 활용 사례

- 사이트 공통 내비게이션/푸터 → 루트 `layout.tsx`
- 섹션별 사이드바 → 중첩 `layout.tsx`
- 페이지 진입 애니메이션처럼 매번 다시 실행해야 하는 효과 → `template.tsx`
- 마케팅/관리 영역 분리 → 라우트 그룹 `(marketing)`, `(admin)`

## 흔한 오해와 주의점

1. **"`app/` 안에 두면 전부 라우트가 된다"** — 그렇지 않습니다. `page.tsx`나
   `route.ts`가 있는 폴더만 공개 라우트가 되고, 그 외 파일은 안전하게 함께 둘 수
   있습니다. 컴포넌트를 `app/`에 넣었다고 URL이 생기지 않습니다.
2. **"prefetch가 개발 서버에서도 일어난다"** — prefetch는 프로덕션 빌드에서만
   동작합니다. `next dev`에서 prefetch 요청이 안 보이는 것은 버그가 아니라 설계입니다.
3. **"layout.tsx는 무슨 일이 있어도 다시 그려지지 않는다"** — 유지 보장은 클라이언트
   전환(`<Link>` 이동)에 대한 것입니다. 주소를 직접 열고 들어오는 첫 방문은 전체
   트리가 서버에서 새로 렌더링됩니다.
4. **"template.tsx가 layout.tsx를 감싼다"** — 반대입니다. 컴포넌트 계층상 템플릿은
   레이아웃 안쪽에서 `page`, `error`, `loading`, `not-found`를 감싸며 같은 폴더의
   레이아웃은 감싸지 않습니다.
5. **"루트 레이아웃은 선택 사항이다"** — 루트 레이아웃은 필수이고 `<html>`, `<body>`를
   반드시 포함해야 합니다. 없으면 빌드가 실패합니다.

## DX 개선

- 라우터 설정 파일(React Router의 `<Routes>` 등)이 사라짐 — 파일 생성이 곧 라우트 등록
- 중첩 레이아웃이 코드 구조 그대로 표현됨 — 레이아웃 중첩을 수동으로 합성할 필요 없음
- `Link`가 자동으로 prefetch하여 클릭 시 즉각 전환

## 관련 문서

- [Pages and Layouts](https://nextjs.org/docs/app/getting-started/layouts-and-pages)
- [Linking and Navigating](https://nextjs.org/docs/app/getting-started/linking-and-navigating) — prefetch, 스트리밍, 클라이언트 전환
- [template 파일 규칙](https://nextjs.org/docs/app/api-reference/file-conventions/template)
- [프로젝트 구조와 조직](https://nextjs.org/docs/app/getting-started/project-structure) — 예약 파일 전체 목록, 라우트 그룹, 비공개 폴더
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) — RSC 페이로드의 구성과 하이드레이션
- [Link 컴포넌트](https://nextjs.org/docs/app/api-reference/components/link) — prefetch prop 값들
- [Next.js 16 릴리스 노트](https://nextjs.org/blog/next-16) — 레이아웃 중복 제거, 증분 prefetch
