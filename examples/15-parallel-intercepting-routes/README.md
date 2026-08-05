# 15 — 병렬 라우트와 인터셉팅 라우트

> 한 화면에 여러 슬롯을 동시에 렌더링하고(병렬), 내비게이션을 가로채 모달로 보여줍니다(인터셉팅).

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 상황 | 화면에서 일어나는 일 | 뒤에서 동작하는 것 |
| --- | --- | --- |
| 갤러리(`/`)에서 썸네일 클릭 | 주소가 `/photo/1`로 바뀌면서 갤러리 위에 **모달**이 뜸 | 인터셉팅 라우트가 클라이언트 내비게이션을 가로챔 |
| `/photo/1`을 주소창에 직접 입력하거나 새로고침 | **전체 사진 페이지**가 열림 | 가로채기가 적용되지 않아 `app/photo/[id]/page.tsx`가 매칭됨 |
| Esc / 배경 클릭 / 닫기 버튼 | 모달이 닫히고 갤러리로 복귀 | `router.back()`으로 이전 히스토리 항목으로 되돌아감 |
| 모달을 닫은 뒤 브라우저 "앞으로" | 모달이 다시 열림 | 앞으로 가기로 인터셉트된 라우트가 다시 렌더링됨 |

### 데모: 갤러리 + 사진 모달

- 갤러리(`/`)에서 썸네일 클릭 → 주소는 `/photo/1`로 바뀌지만 **모달**이 뜸
- `/photo/1`을 주소창에 직접 입력하거나 새로고침 → **전체 페이지**가 열림
- Esc/배경 클릭/닫기 → `router.back()`으로 갤러리 복귀

### 파일 구조

```
app/
  layout.tsx                     # children + @modal 두 슬롯 렌더링
  page.tsx                       # 갤러리
  default.tsx                    # children 슬롯 기본값 (page 재사용)
  photo/[id]/page.tsx            # 전체 페이지 (직접 접속용)
  @modal/
    default.tsx                  # null (Next 16: 슬롯마다 default 필수)
    (.)photo/[id]/page.tsx       # 인터셉팅 라우트 → 모달
```

## 동작 원리

이 예시는 두 가지 라우팅 기능이 맞물려 동작합니다.

1. **병렬 라우트(parallel routes)**: 한 레이아웃이 여러 "슬롯"을 동시에 렌더링하는 구조. 모달이 갤러리 위에 겹쳐질 수 있는 판을 깔아줍니다.
2. **인터셉팅 라우트(intercepting routes)**: 클라이언트 내비게이션을 가로채서, 다른 라우트의 내용을 현재 화면 위에 겹쳐 보여주는 규칙. 모달을 띄우는 방아쇠입니다.

### 병렬 라우트 = 레이아웃 props로 주입되는 슬롯

`@`로 시작하는 폴더는 **슬롯**입니다. 슬롯은 라우트 세그먼트가 아니라, 부모 레이아웃에 **props로 주입되는 렌더링 자리**입니다. 이 예시의 루트 레이아웃은 `children`(갤러리)과 `@modal`(모달) 두 슬롯을 한 화면에 그립니다.

```tsx
// app/layout.tsx (발췌)
export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
        {modal}
      </body>
    </html>
  );
}
```

핵심 성질은 세 가지입니다.

- **한 URL이 여러 세그먼트를 동시에 렌더링합니다.** `/photo/1`로 이동하면 `children` 슬롯과 `@modal` 슬롯이 각자 독립적으로 렌더링되어 한 화면에 합성됩니다. "갤러리 위에 모달"은 CSS 트릭이 아니라 두 슬롯의 렌더 결과입니다.
- **슬롯은 URL에 나타나지 않습니다.** `@modal` 폴더는 주소의 일부가 아닙니다. `/@modal/photo/1` 같은 주소는 존재하지 않고, 실제 주소는 `/photo/1`입니다.
- **`children`은 암시적 슬롯입니다.** 폴더를 만들지 않아도 `app/page.tsx`가 `children` 슬롯으로 전달됩니다. 문서 표현대로 `app/page.js`는 `app/@children/page.js`와 같습니다.

### 슬롯의 활성 상태와 `default.tsx`의 역할

슬롯이 어떤 하위 페이지를 보여주고 있는지 Next.js가 기억하는 것을 **활성 상태(active state)** 라고 합니다. 이걸 어떻게 다루느냐에 따라 내비게이션 종류별로 동작이 갈립니다.

- **소프트 내비게이션(클라이언트 내비게이션)**: `Link` 클릭이나 `router.push()`처럼 페이지 전체를 다시 로드하지 않는 이동입니다. Next.js가 각 슬롯의 활성 상태를 기억하고 있다가, 바뀐 슬롯만 다시 렌더링하는 **부분 렌더(partial render)** 를 수행합니다. URL이 `/photo/1`로 바뀌어도 `children` 슬롯의 갤러리가 그대로 남아있는 이유가 이것입니다.
- **하드 내비게이션(전체 페이지 로드)**: 새로고침이나 주소 직접 입력처럼 서버에서 페이지 전체를 새로 받아오는 이동입니다. 이 경우 서버는 슬롯이 아까 무엇을 보여주고 있었는지 알 수 없습니다. 현재 URL과 매칭되지 않는 슬롯은 `default.tsx`를 렌더링합니다.

`default.tsx`는 바로 그 **복구 불가 상황의 폴백**입니다.

이 예시에서 각 진입 방식별로 두 슬롯에 무엇이 렌더링되는지 정리하면 다음과 같습니다.

| 진입 방식 | URL | `children` 슬롯 | `@modal` 슬롯 |
| --- | --- | --- | --- |
| `/` 접속 | `/` | 갤러리 | `null` (default) |
| 갤러리에서 썸네일 클릭 (소프트) | `/photo/1` | 갤러리 유지 | 모달 |
| 모달이 열린 상태에서 새로고침 (하드) | `/photo/1` | 전체 사진 페이지 | `null` (default) |
| `/photo/1` 주소창 직접 입력 (하드) | `/photo/1` | 전체 사진 페이지 | `null` (default) |

소프트 내비게이션 행과 하드 내비게이션 행의 `@modal` 슬롯이 다른 것이 이 예시의 핵심입니다.

> **Next.js 16 변경점**: 병렬 라우트 슬롯마다 `default.tsx`가 **필수**가
> 되었습니다. 없으면 빌드가 실패합니다. 이름 있는 슬롯은 `default.tsx`가
> 없으면 에러가 나고, `children` 슬롯은 없으면 해당 라우트가 404가 됩니다.
> 이전처럼 404를 보여주고 싶다면 `default.tsx`에서 `notFound()`를 호출하면
> 됩니다. 이 예시의 `@modal/default.tsx`는 `null`을 반환합니다.

### 인터셉팅 라우트 표기 = 현재 세그먼트 기준 상대 경로

인터셉팅 라우트는 `(..)` 계열 표기로 "어디로 가는 내비게이션을 가로챌지"를 선언합니다. 파일 시스템의 `../`와 비슷하지만, **라우트 세그먼트 기준 상대 경로**라는 점이 다릅니다.

| 접두사 | 의미 |
| --- | --- |
| `(.)` | 같은 수준의 세그먼트 매칭 |
| `(..)` | 한 단계 위 |
| `(..)(..)` | 두 단계 위 |
| `(...)` | 루트 `app`부터 전부 |

여기서 가장 많이 헷갈리는 부분이 하나 있습니다. **`@slot` 폴더는 세그먼트로 치지 않는다**는 것입니다. 상대 경로의 기준은 파일 트리 깊이가 아니라 라우트 세그먼트 구조입니다. 이 예시에서 `app/@modal/(.)photo/[id]`는 파일 트리로는 두 단계 안에 있지만, `@modal`은 세그먼트가 아니므로 기준점은 사실상 `app/`과 같습니다. 그래서 `(.)photo`는 "같은 수준의 `photo` 세그먼트", 즉 `/photo/[id]`로 가는 내비게이션을 가로챕니다.

### 이중 동작: 소프트 내비게이션은 모달, 하드 내비게이션은 전체 페이지

인터셉팅 라우트는 **클라이언트 내비게이션에서만** 발동합니다. 이게 이 패턴의 전부라고 해도 좋을 정도로 중요합니다.

- **소프트 내비게이션** (갤러리에서 `<Link>` 클릭): 라우터가 `/photo/1`로의 이동을 처리하다가 `@modal/(.)photo/[id]` 매칭을 발견하고 가로챕니다. `@modal` 슬롯이 모달을 렌더링하고, `children` 슬롯은 갤러리를 유지합니다.
- **하드 내비게이션** (주소창 직접 입력, 새로고침, 공유 링크): 가로채기가 일어나지 않습니다. `children` 슬롯에는 `app/photo/[id]/page.tsx`(전체 페이지)가 매칭되고, `@modal` 슬롯은 매칭되는 라우트가 없어 `@modal/default.tsx`(`null`)가 렌더링됩니다.

같은 URL인데 어떻게 들어왔는지에 따라 다른 화면이 나오는 것은 마법이 아니라 이 규칙 덕분입니다. 모달이 "새로고침해도 안전"한 것이 아니라, 새로고침하면 자연스럽게 전체 페이지로 대체되어 사용자 입장에서는 둘 다 올바른 화면이 보이는 것입니다.

### `router.back()`으로 모달을 닫는 원리

모달을 연 것은 상태 변수가 아니라 **내비게이션**이었습니다. `<Link>`를 클릭한 순간 브라우저 히스토리에 `/photo/1` 항목이 하나 추가된 것입니다. 그러니 닫는 법도 대칭입니다. `router.back()`을 호출하면 히스토리가 한 칸 뒤로 가서 `/`로 클라이언트 내비게이션이 일어납니다.

- `/`에서는 `/photo`를 가로챌 내비게이션이 아니므로 `@modal` 슬롯이 `default.tsx`(`null`)로 내려앉고 모달이 언마운트됩니다.
- `children` 슬롯의 갤러리는 소프트 내비게이션 동안 계속 살아 있었으므로, 다시 로드될 것 없이 그대로 표시됩니다.

덕분에 브라우저의 뒤로가기/앞으로가기 버튼, URL 공유가 모달과 자연스럽게 호환됩니다. 공식 문서가 정리한 이 패턴의 장점은 다음 네 가지입니다.

- 모달 내용을 **URL로 공유**할 수 있다
- 새로고침 시 모달이 꺼지는 대신 **전체 페이지로 맥락이 보존**된다
- 뒤로가기로 이전 화면이 아니라 **모달이 닫힌다**
- 앞으로가기로 **모달이 다시 열린다**

### 슬롯의 활성 세그먼트 읽기

레이아웃에서 슬롯이 현재 어떤 하위 라우트를 보여주고 있는지 알아야 할 때는 `useSelectedLayoutSegment`(또는 복수형 `useSelectedLayoutSegments`)에 `parallelRoutesKey`를 넘기면 됩니다. 공식 문서의 예시를 빌리면 이렇습니다.

```tsx
// 공식 문서 예시: app/layout.tsx
'use client'

import { useSelectedLayoutSegment } from 'next/navigation'

export default function Layout({ auth }: { auth: React.ReactNode }) {
  const loginSegment = useSelectedLayoutSegment('auth')
  // 사용자가 /login 으로 이동하면 loginSegment === 'login'
}
```

이 예시처럼 모달의 열림/닫힘을 URL 세그먼트 존재 여부로 판별할 수 있어, `useState` 없이도 모달 상태를 주소와 동기화할 수 있습니다.

### 예시의 사진 모달 흐름 순서도

**소프트 내비게이션 (갤러리에서 썸네일 클릭)**

```text
1. 사용자는 / 에 있음          → children=갤러리, @modal=null(default)
2. <Link href="/photo/1"> 클릭 → 클라이언트 내비게이션 시작
3. 라우터가 @modal/(.)photo/[id] 매칭 발견 → 인터셉트
4. URL이 /photo/1 로 변경
5. children 슬롯: 갤러리 유지 (부분 렌더, 활성 상태 보존)
6. @modal 슬롯: PhotoModal 렌더링 → 갤러리 위에 모달 표시
7. Esc 또는 닫기 클릭 → router.back()
8. URL이 / 로 복귀 → @modal 슬롯이 다시 null → 모달 사라짐, 갤러리는 그대로
```

**하드 내비게이션 (주소창에 `/photo/1` 직접 입력 또는 새로고침)**

```text
1. 브라우저가 서버에 /photo/1 전체 페이지 요청
2. 인터셉팅 라우트는 발동하지 않음 (클라이언트 내비게이션이 아님)
3. children 슬롯: app/photo/[id]/page.tsx 매칭 → 전체 사진 페이지
4. @modal 슬롯: 매칭 없음 → @modal/default.tsx → null
```

## 코드와 함께 보는 설명

### `app/layout.tsx` — 두 슬롯을 합성하는 루트 레이아웃

레이아웃이 `modal` prop을 받아 `children` 뒤에 배치합니다. `@modal` 폴더명이 props에서는 `modal`로 전달되는 점에 주목하세요(`@`는 폴더 규칙일 뿐 props 이름에 포함되지 않습니다). 전체 코드는 위 "동작 원리"의 발췌와 같습니다.

### `app/page.tsx` — 갤러리 (children 슬롯)

6개의 썸네일이 전부 `<Link href={/photo/${id}}>`입니다. 모달을 여는 별도의 상태 관리(`useState`, 전역 스토어 등)가 전혀 없습니다. 일반적인 페이지 이동 링크와 똑같고, 가로채기는 라우팅 계층에서 일어나기 때문입니다.

```tsx
// app/page.tsx (발췌)
{photos.map((id) => (
  <Link key={id} href={`/photo/${id}`}>
    <img src={`/photos/${id}.svg`} alt={`사진 ${id}`} ... />
  </Link>
))}
```

### `app/@modal/(.)photo/[id]/page.tsx` — 인터셉팅 라우트

이 파일이 존재한다는 것 자체가 "같은 수준의 `/photo/[id]`로 가는 클라이언트 내비게이션을 가로채겠다"는 선언입니다. 서버 컴포넌트로 `params`를 받아 모달 본체에 넘깁니다.

```tsx
// app/@modal/(.)photo/[id]/page.tsx (발췌)
export default async function PhotoModalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PhotoModal id={id} />;
}
```

> 참고: Next.js 15부터 `params`는 Promise입니다. `await params`로 풀어서
> 쓰는 것이 올바른 사용법입니다.

모달 본체(`PhotoModal`)는 클라이언트 컴포넌트로 분리되어 있지만, 인터셉트된 라우트 페이지 자체는 서버 컴포넌트입니다. 공식 문서의 권장 사항처럼 모달 껍데기와 내용을 분리하면 모달 안의 내용을 서버 컴포넌트로 유지할 수 있습니다.

### `components/photo-modal.tsx` — 닫기가 `router.back()`인 이유

```tsx
// components/photo-modal.tsx (발췌)
export function PhotoModal({ id }: { id: string }) {
  const router = useRouter();

  const close = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  // ...
}
```

`close`가 하는 일은 오직 `router.back()`뿐입니다. 배경 클릭은 바깥 `div`의 `onClick={close}`, 내부 카드는 `e.stopPropagation()`으로 클릭이 닫기로 새어 나가지 않게 막습니다. 모달을 여는 것(링크 클릭 = 내비게이션)과 닫는 것(뒤로가기 = 내비게이션)이 모두 라우터의 일이므로, 컴포넌트에는 표시용 상태가 하나도 없습니다.

### `app/photo/[id]/page.tsx` — 전체 페이지 버전

직접 접속/새로고침 시 열리는 화면입니다. 인터셉팅 라우트 패턴을 쓸 때는 **전체 페이지 버전을 반드시 함께 만들어야** 합니다. 공유받은 URL로 들어오는 사람, 새로고침하는 사람에게 보여줄 화면이 필요하기 때문입니다.

```tsx
// app/photo/[id]/page.tsx (발췌)
export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="container">
      <nav className="breadcrumb">
        <Link href="/">갤러리</Link> <span>/</span> <span>photo/{id}</span>
      </nav>
      <h1>사진 #{id} (전체 페이지)</h1>
      ...
```

모달 페이지(`@modal/(.)photo/[id]/page.tsx`)와 같은 `params` 시그니처를 공유하므로, 상세에 필요한 데이터 페칭 로직을 양쪽에서 재사용하기 좋습니다.

### `app/default.tsx`와 `app/@modal/default.tsx` — 슬롯의 폴백

```tsx
// app/default.tsx 전체
// 병렬 라우트를 쓸 때는 children 슬롯에도 default가 필요합니다.
// 여기서는 홈(갤러리)을 그대로 보여줍니다.
export { default } from "./page";
```

```tsx
// app/@modal/default.tsx 전체
// 모달 슬롯의 기본값: 아무것도 렌더링하지 않습니다.
// Next.js 16에서는 병렬 라우트 슬롯마다 default 파일이 반드시 있어야 합니다.
export default function Default() {
  return null;
}
```

- `app/default.tsx`: `children`(암시적 슬롯)의 기본값. 가장 자연스러운 값은 평소 화면과 같은 것이므로 `page.tsx`를 그대로 재사용합니다.
- `app/@modal/default.tsx`: 모달 슬롯의 기본값. 모달이 활성 상태가 아닐 때는 아무것도 없어야 하므로 `null`입니다. 하드 내비게이션 시 모달 슬롯의 매칭이 없어 이 파일이 선택됩니다.

## 정량 비교: 모달 구현 방식

| 방식 | 상세 전환 시 전송/렌더링 |
| --- | --- |
| 별도 모달 라이브러리 + 수동 상태 | URL 미변경 — 새로고침 시 상태 소실, 공유 불가 |
| 전체 페이지 이동 | 페이지 전체 재렌더 + 레이아웃 재전송 |
| 인터셉팅 라우트 | **모달 부분만** 렌더 + URL 유지(공유/새로고침 안전) |

인터셉팅 라우트 방식이 빠른 이유는 렌더링 범위입니다. 소프트 내비게이션에서 Next.js는 바뀐 슬롯(`@modal`)만 다시 렌더링합니다. 갤러리(children)는 다시 만들지 않고, 레이아웃은 재전송되지 않습니다.

## 좋은 활용 사례

- **목록 → 상세 모달**: 사진 갤러리, 상품 미리보기, 게시물 미리보기. 이 예시가 바로 이 패턴입니다.
- **로그인 모달, 설정 패널** 등 "맥락을 유지하는" 보조 화면. 전체 `/login` 페이지를 따로 두면서 내비게이션 바에서는 모달로 띄우는 구성이 공식 문서의 대표 예시입니다.
- **전체 페이지 버전도 반드시 함께 만들기**: 직접 접속 대비. 인터셉팅 라우트만 있고 전체 페이지가 없으면 공유 링크가 깨집니다.
- **탭 그룹**: 슬롯 안에 `layout.tsx`를 두면 슬롯끼리 독립적으로 내비게이션하는 탭 UI를 만들 수 있습니다. 대시보드의 `@analytics` 슬롯에 `/page-views`, `/visitors` 탭을 두는 식입니다.
- **조건부 라우트**: 레이아웃에서 권한에 따라 슬롯을 골라 렌더링할 수 있습니다(`role === 'admin' ? admin : user`). 단, 선택받지 못한 슬롯도 서버에서는 렌더링되므로 권한 검사는 각 슬롯의 페이지나 데이터 접근 계층에서 해야 합니다.
- **슬롯별 로딩/에러 상태**: 병렬 라우트는 슬롯마다 독립적으로 스트리밍되므로, 슬롯마다 `loading.tsx`와 에러 UI를 따로 둘 수 있습니다.

## DX 개선

- 모달 + 라우팅을 선언적 파일 구조로 해결 — 모달 상태 관리 코드 없음
- 브라우저 뒤로가기/URL 공유가 무료로 동작
- `useState`로 모달을 관리하던 방식에서 빠지기 쉬운 "뒤로가기 눌렀는데 모달이 안 닫힘", "주소 복사했는데 모달이 안 열림" 문제가 구조적으로 사라집니다.

## 흔한 오해와 주의점

1. **`@` 폴더가 URL의 일부라고 오해하기 쉽습니다.** 슬롯은 라우트 세그먼트가 아니라 레이아웃 props일 뿐입니다. 주소는 언제나 `/photo/1`처럼 슬롯 없는 형태입니다. 같은 이유로 슬롯 하나만 동적으로 만들어도 그 수준의 모든 슬롯이 동적이 되는 제약이 있습니다.
2. **새로고침하면 모달이 그대로 떠 있을 거라고 기대하면 안 됩니다.** 하드 내비게이션에서는 인터셉트가 발동하지 않아 전체 페이지가 열립니다. 이건 버그가 아니라 의도된 동작이며, 전체 페이지 버전이 필요한 이유입니다.
3. **`default.tsx`를 선택 사항으로 알기 쉽습니다.** Next.js 16부터는 모든 병렬 슬롯에 `default.tsx`가 필수이며, 없으면 빌드가 실패합니다. `children` 슬롯도 예외가 아닙니다.
4. **`(..)` 표기를 파일 트리 깊이라고 읽으면 안 됩니다.** 기준은 라우트 세그먼트이고 `@slot` 폴더는 세그먼트로 치지 않습니다. `app/@modal/(.)photo`가 `/photo`를 가로채는 이유가 이것입니다.
5. **모달 닫기를 반드시 `router.back()`으로만 해야 하는 것은 아닙니다.** `Link`로 다른 주소로 이동해서 닫을 수도 있는데, 이때는 이동 목적지에서 모달 슬롯에 매칭되어 `null`을 반환하는 라우트가 필요합니다(예: `@modal/page.tsx`나 catch-all). 그렇지 않으면 소프트 내비게이션의 활성 상태 보존 때문에 모달이 그대로 남습니다. 내비게이션으로 연 모달은 `router.back()`으로 닫는 것이 이 함정을 피하는 가장 단순한 방법입니다.

## 관련 문서

- [Parallel Routes API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes)
- [Intercepting Routes API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes)
- [default.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/default)
- [nextgram — 인터셉팅 라우트 모달 공식 예시](https://github.com/vercel-labs/nextgram)
