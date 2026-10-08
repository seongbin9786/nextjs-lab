# 03 — 서버 vs 클라이언트 컴포넌트

> 모든 컴포넌트는 기본적으로 서버 컴포넌트. 상호작용이 필요할 때만 `"use client"`.

## 실행

```bash
pnpm install
node scripts/gen-catalog.mjs   # 번들 비교용 40KB 데이터 생성
pnpm dev                       # http://localhost:3000
bash scripts/compare-bundles.sh  # 번들 크기 정량 비교
```

## 이 예시가 보여주는 것

| 페이지 | 데모 |
| --- | --- |
| `/` | 서버 컴포넌트 기본 동작 (렌더링 시각이 서버에서 계산됨) |
| `/client-interactive` | `useState` + 버튼 — `"use client"` 필요 |
| `/server-only` | `node:fs`로 서버 파일 읽기 — 클라이언트 번들에 없음 |
| `/composition` | 서버 콘텐츠를 클라이언트 컴포넌트의 children으로 전달 |
| `/boundary` | 경계를 넘어갈 수 있는 props / 없는 props |
| `/compare` | 서버 합성 vs 전부-클라이언트 번들 크기 정량 비교 |

## 동작 원리

### 서버는 한 요청에 대해 세 조각을 만듭니다

App Router에서 라우트 하나를 요청하면 서버는 결과물 **세 조각**을 만들어
보냅니다. 각 조각의 역할이 다르고, 브라우저에서 쓰이는 시점도 다릅니다.

| 조각 | 내용 | 언제 쓰이나 |
| --- | --- | --- |
| ① HTML | 서버에서 미리 렌더링한 완성 화면 | 도착 즉시 첫 페인트 (인터랙션은 아직 없음) |
| ② RSC 페이로드 | 서버 컴포넌트 렌더링 결과를 직렬화한 데이터 | React가 서버/클라이언트 컴포넌트 트리를 재구성(reconcile)할 때 |
| ③ JS 번들 | 클라이언트 컴포넌트의 실제 코드 | 하이드레이션 — DOM에 이벤트 핸들러를 연결해 화면을 상호작용 가능하게 만들 때 |

서버에서 일어나는 일을 순서대로 보면 이렇습니다. Next.js는 렌더링 작업을
라우트 세그먼트(layout과 page) 단위로 나눠 처리합니다.

1. **서버 컴포넌트**는 RSC 페이로드라는 전용 데이터 형식으로 렌더링됩니다.
2. **클라이언트 컴포넌트**와 RSC 페이로드는 HTML을 미리 렌더링하는 데
   함께 사용됩니다.

### RSC 페이로드에는 무엇이 담기나요

RSC 페이로드는 렌더링된 서버 컴포넌트 트리의 **컴팩트한 직렬화 표현**
입니다. 여기에 담기는 것은 다음 세 가지입니다.

- 서버 컴포넌트의 **렌더링 결과**
- 클라이언트 컴포넌트가 렌더링될 **자리(placeholder)** 와 그 컴포넌트의
  **자바스크립트 파일에 대한 참조**
- 서버 컴포넌트가 클라이언트 컴포넌트에 넘긴 **props**

핵심은 두 번째 항목입니다. 클라이언트 컴포넌트는 페이로드에 **코드가
들어가지 않고 "어느 JS 파일을 로딩해서 이 자리에 렌더링하라"는 참조만**
들어갑니다. 실제 코드는 ③ JS 번들 쪽에 있고, 브라우저가 그 파일을 내려받아
해당 자리에 끼워 넣습니다. 서버 컴포넌트의 렌더링 로직 자체는 어느 JS
번들에도 들어가지 않습니다.

### 브라우저에서는 세 단계로 화면이 완성됩니다

첫 로딩에서 클라이언트가 하는 일입니다.

1. **HTML**로 즉각적인 미리보기를 표시합니다. 아직 빠르기만 하고
   상호작용은 안 되는 상태입니다.
2. **RSC 페이로드**로 클라이언트 컴포넌트 트리와 서버 컴포넌트 트리를
   재구성합니다.
3. **JS 번들**로 클라이언트 컴포넌트를 하이드레이션합니다. 하이드레이션은
   React가 정적인 HTML에 이벤트 핸들러를 붙여 상호작용 가능하게 만드는
   과정입니다.

이어지는 내비게이션(클라이언트 라우팅)에서는 더 가볍게 동작합니다.
RSC 페이로드는 미리 가져와서(prefetch) 캐시되고, 클라이언트 컴포넌트는
서버 렌더링된 HTML 없이 클라이언트에서만 렌더링됩니다.

### `"use client"` 경계에서 실제로 일어나는 일

`"use client"`는 파일 첫 줄에 쓰며, 서버 모듈 그래프와 클라이언트 모듈
그래프 사이의 **경계**를 선언합니다. 경계가 만들어지는 순간 다음 규칙이
작동합니다.

- 해당 파일이 **import하는 모든 모듈**과 그 파일이 직접 렌더링하는
  컴포넌트가 클라이언트 번들에 포함됩니다. 그래서 매 파일마다 지시자를
  붙일 필요가 없습니다.
- 경계는 **파일에 붙는 것**이지 함수나 JSX 조각에 붙는 것이 아닙니다.
- 반대로, **children 같은 props로 전달되는 서버 컴포넌트는 클라이언트
  컴포넌트의 모듈 그래프로 들어오지 않습니다.** 이 부분은 아래 합성
  패턴에서 다시 설명합니다.

```tsx
// 서버 컴포넌트 (기본) — 이 코드는 브라우저에 전송되지 않음
const data = await db.posts.findMany();

// 클라이언트 컴포넌트 — 파일 첫 줄에 선언
"use client";
const [count, setCount] = useState(0);
```

경계를 넘어가는 props는 **직렬화 가능한 값**이어야 합니다. 서버에서
클라이언트로 보낼 때 React가 직렬화해야 하기 때문입니다.

| 경계를 넘어갈 수 있는 props | 넘어갈 수 없는 것 |
| --- | --- |
| 문자열, 숫자, 불리언, null | 함수 (이벤트 핸들러 등) |
| 배열, 중첩 객체 | 클래스 인스턴스 (일반적인 경우) |
| Date, Map, Set (직렬화 지원) | DB 커넥션, 파일 핸들 |
| React 노드 (children — 렌더링된 결과로 전달) | 서버 컴포넌트 자체를 import |

### 합성 패턴: 왜 "클라이언트 컴포넌트 안에 서버 컴포넌트"가 가능한가

클라이언트 컴포넌트는 서버 컴포넌트를 **import할 수 없습니다.** 서버
코드가 클라이언트 번들로 빨려 들어가기 때문입니다. 그런데도 "클라이언트
컴포넌트가 서버 콘텐츠를 감싸는" 구성이 가능한데, 순서를 보면 이유가
명확합니다.

1. `<Modal><Cart /></Modal>` 같은 JSX를 **평가하는 쪽은 서버 컴포넌트인
   page**입니다. children으로 들어간 `<Cart />`는 page의 모듈 그래프
   소속입니다.
2. 따라서 children은 **서버에서 먼저 렌더링**되어 렌더링 결과가 됩니다.
3. RSC 페이로드는 "이 자리에 Modal(클라이언트 컴포넌트)을 렌더링하고,
   그 children 자리에는 이 서버 렌더링 결과를 넣어라"를 기록합니다.
4. 클라이언트 컴포넌트(Modal)는 children이 어떻게 만들어졌는지 모릅니다.
   그저 이미 렌더링된 결과물을 자기 자리에 끼워 넣을 뿐입니다.

즉, children이 props로 전달되는 순간 그것은 코드가 아니라 **이미 서버에서
렌더링이 끝난 산출물**입니다. 서버 전용 로직(fs, DB 접근)은 서버에 남고,
클라이언트 번들에는 클라이언트 컴포넌트 자신의 코드(예: 접기/펼치기 상태)
만 들어갑니다.

### 전체 흐름 다이어그램

```
                        서버
 ┌───────────────────────────────────────────────────────┐
 │ app/composition/page.tsx (서버 컴포넌트)               │
 │   ① fs.readFile 실행, 데이터 준비                      │
 │   ② <InteractiveCard> 발견 → 클라이언트 경계           │
 │      (코드를 실행하지 않고 JS 번들 참조만 기록)         │
 │   ③ children(<p>...)은 서버에서 렌더링                 │
 └───────────────────────────┬───────────────────────────┘
                             │ 응답에 실려 가는 세 조각
         ┌───────────────────┼───────────────────────┐
         ▼                   ▼                       ▼
      ① HTML             ② RSC 페이로드           ③ JS 번들
   즉시 그릴 화면      서버 렌더링 결과 +        클라이언트 컴포넌트
   (인터랙션 없음)     클라이언트 컴포넌트        코드 (InteractiveCard,
                       자리 표시 + JS 참조         useState 포함)
         │                   │                       │
         ▼                   ▼                       ▼
                         브라우저
   ④ HTML로 첫 페인트 → ⑤ RSC 페이로드로 트리 재구성
      → ⑥ JS 번들로 하이드레이션 (버튼 이벤트 연결 완료)
```

## 코드와 함께 보는 설명

### `/` — 홈: 순수 서버 컴포넌트 (`app/page.tsx`)

```tsx
// app/page.tsx
export default function HomePage() {
  const renderedAt = new Date().toLocaleTimeString("ko-KR");
  // ...
  // 이 문단의 렌더링 시각: {renderedAt}
```

`renderedAt`은 **서버에서** 계산됩니다. 새로고침하면 다시 계산되지만,
브라우저에서 버튼을 아무리 눌러도 바뀌지 않습니다. 서버는 버튼 클릭을
모르기 때문입니다. 이 페이지의 렌더링 로직은 클라이언트 JS 번들에
포함되지 않습니다.

### `/client-interactive` — 최소 클라이언트 컴포넌트 (`components/counter.tsx`)

```tsx
// components/counter.tsx
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  // ...
  return <button type="button" onClick={() => setCount((c) => c + 1)}>+1</button>;
}
```

파일 첫 줄의 `"use client"`가 이 파일을 클라이언트 번들에 포함시킵니다.
이 파일이 import하는 것(여기선 `useState`)도 함께 클라이언트로 갑니다.
`app/client-interactive/page.tsx` 자체는 서버 컴포넌트로 남아 있고,
클라이언트 "잎사귀"인 `<Counter />`만 경계 안으로 들어갑니다.

### `/server-only` — 서버 파일 시스템 접근 (`app/server-only/page.tsx`)

```tsx
// app/server-only/page.tsx
import { readFile } from "node:fs/promises";

export default async function ServerOnlyPage() {
  const pkgRaw = await readFile(path.join(process.cwd(), "package.json"), "utf-8");
  // ...
```

`node:fs`는 브라우저에 없는 API지만 이 페이지는 문제없이 동작합니다.
이 코드는 서버에서만 실행되고 브라우저로 전송되지 않기 때문입니다.
덕분에 얻는 것은 세 가지입니다.

- **번들 크기 0바이트**: 이 페이지의 렌더링 로직은 클라이언트 JS 번들에
  포함되지 않습니다. 사용자는 완성된 HTML을 받습니다.
- **비밀 유지**: API 키, DB 접속 문자열이 브라우저로 새지 않습니다.
- **데이터 근처에서 접근**: 브라우저 → API 서버 → DB 왕복 없이 서버에서
  곧바로 데이터에 접근합니다.

확인 방법: DevTools → Network → JS 파일들을 보세요. fs 호출 코드는
어디에도 없습니다. 서버 전용 모듈을 더 안전하게 지키려면 `server-only`
패키지를 import해 두면 됩니다. 클라이언트 컴포넌트가 그 모듈을 import하는
순간 빌드 단계에서 오류가 납니다.

### `/composition` — 합성 패턴 (`app/composition/page.tsx` + `components/interactive-card.tsx`)

```tsx
// app/composition/page.tsx (서버 컴포넌트)
const depCount = Object.keys(pkg.dependencies).length;
return (
  <InteractiveCard title="서버에서 만든 콘텐츠 (children)">
    <p>의존성이 <strong>{depCount}개</strong>입니다.</p>
  </InteractiveCard>
);
```

```tsx
// components/interactive-card.tsx ("use client")
export function InteractiveCard({ title, children }) {
  const [open, setOpen] = useState(true);
  // children이 어떻게 만들어졌는지 모름 — 받은 그대로 렌더링
}
```

fs.readFile은 서버에서 실행되고, 카드를 접고 펼치는 버튼만 클라이언트가
처리합니다. `InteractiveCard`는 children의 내용을 모르기 때문에 서버 전용
로직이 클라이언트 번들로 들어갈 길이 없습니다.

### `/boundary` — 경계 직렬화 확인 (`app/boundary/page.tsx` + `components/props-display.tsx`)

서버 컴포넌트가 만든 값(`문자열`, `42`, `Date`, 배열, 중첩 객체)을
클라이언트 컴포넌트 `PropsDisplay`에 props로 넘깁니다. 이 지점이
"서버 → 클라이언트 경계"입니다. 전부 직렬화 가능한 값이라 통과합니다.
페이지에 있는 비교 표처럼 함수나 DB 커넥션은 이 경계를 넘을 수 없습니다.

### `/compare` — 번들 크기 비교의 구조

같은 화면을 두 방식으로 만들었습니다. 차이는 **데이터와 페이지 로직이
어느 번들에 실리느냐**뿐입니다.

- `app/compare/server/page.tsx` (서버 컴포넌트): `lib/catalog`를 import해
  클라이언트 컴포넌트에 props로 전달합니다. catalog 리터럴은 서버 번들에만
  있습니다.
- `app/compare/client/page.tsx` (`"use client"`): 같은 catalog를 **직접
  import**하므로 40KB 리터럴이 브라우저 JS 번들에 그대로 들어갑니다.
- `components/catalog-table.tsx` (`"use client"`): 두 페이지가 공유하는
  테이블. 데이터를 스스로 import하지 않고 **props로만** 받습니다. 그래서
  데이터의 운명은 "누가 catalog를 import하는가"가 결정합니다.

## 정량 비교: 번들 크기

`/compare`에서 같은 화면을 두 방식으로 만들어 첫 로딩 JS를 잰 결과
(`scripts/compare-bundles.sh`, 2026-08 실측):

| 구성 | 첫 로딩 JS |
| --- | --- |
| 서버 페이지 + 클라이언트 잎사귀 (`/compare/server`) | **560.9 kB** |
| 전부 클라이언트 (`/compare/client`) | **617.1 kB** |
| 차이 | **56.2 kB** |

전부-클라이언트 방식은 약 40KB 데이터 리터럴과 페이지 코드가 브라우저 JS에
포함됩니다. 서버 합성 방식에서 데이터는 HTML/RSC 페이로드로 가서 JS 번들에서
빠집니다. 데이터·페이지가 커질수록 격차는 그대로 벌어집니다.

`/server-only` 페이지에서 `node:fs` 코드를 썼는데도 DevTools의 JS 어디에도
그 코드가 없는 것을 확인할 수 있습니다 (번들 크기 0바이트의 증거).

### 측정 방법 (`scripts/compare-bundles.sh`)

스크립트가 하는 일은 다음과 같습니다.

1. `scripts/gen-catalog.mjs`로 상품 260개(약 40KB)짜리 `lib/catalog.ts`를
   생성합니다.
2. `pnpm build`로 프로덕션 빌드를 만들고, 포트 3126으로 `pnpm start`합니다.
3. 각 라우트의 HTML을 curl로 받아 그 안에 포함된
   `<script src="/_next/static/...js">` 태그를 모두 수집합니다.
4. `.next/static`에 있는 실제 파일 크기를 합산해 kB로 출력합니다
   (압축 전 원본 크기 기준).
5. `app/compare/page.tsx`에 자리표시자(`__SERVER__` 등)가 남아 있으면 결과를 표에
   자동으로 반영합니다. 저장소의 페이지에는 이미 측정값이 들어 있으므로, 다시 측정한
   값은 터미널 출력을 보고 직접 고칩니다.

## 좋은 활용 사례

- `page.tsx`는 항상 서버 컴포넌트로 유지
- 버튼/입력/차트 등 "잎사귀"만 `"use client"`
- 데이터는 서버에서 fetch해서 props로 전달 (클라이언트 fetch 워터폴 방지)
- 서버 전용 모듈 보호가 필요하면 [`server-only` 패키지](https://www.npmjs.com/package/server-only) 사용
- 환경 변수도 같은 원리: `NEXT_PUBLIC_` 접두어가 붙은 변수만 클라이언트
  번들에 포함됩니다. 비밀 값은 접두어 없이 서버에서만 씁니다.

## DX 개선

- 서버/클라이언트 구분 없이 한 파일에서 시작 → 필요할 때만 분리
- 데이터 fetching을 위한 `useEffect` + 상태 관리 보일러플레이트가 사라짐
- 비밀 키가 클라이언트로 새는 사고를 구조적으로 방지

## 흔한 오해와 주의점

1. **"클라이언트 컴포넌트는 브라우저에서만 렌더링된다"** — 아닙니다.
   클라이언트 컴포넌트도 서버에서 먼저 렌더링(SSR)되어 HTML에 포함되고,
   브라우저에서 하이드레이션됩니다. "클라이언트 컴포넌트 = 브라우저 전용"
   이 아닙니다.
2. **"`"use client"` 파일 안에서는 서버 컴포넌트를 절대 못 쓴다"** —
   절반만 맞습니다. 서버 컴포넌트를 직접 **import**하는 것은 불가하지만,
   서버에서 렌더링된 결과를 children/props로 전달받아 그 자리에 넣는 것은
   가능합니다. 이것이 합성 패턴입니다.
3. **"서버에서 클라이언트로 props로 뭐든 넘길 수 있다"** — 함수, 클래스
   인스턴스, DB 커넥션 같은 직렬화 불가능한 값은 경계를 넘지 못합니다.
   이벤트 핸들러를 props로 내려보내는 SPA식 습관은 여기서 깨집니다.
4. **"`"use client"`는 컴포넌트 하나에 붙이는 딱지다"** — 경계는 파일
   단위입니다. 그 파일이 import하는 모듈 그래프 전체가 클라이언트 번들에
   포함되므로, 경계는 가능한 한 깊은 잎사귀에 배치해야 번들이 작아집니다.
5. **"HTML 하나면 끝이다"** — HTML은 인터랙션이 없는 미리보기입니다.
   RSC 페이로드로 트리를 재구성하고, JS 번들이 하이드레이션되어야 버튼이
   눌립니다. 세 조각은 각자 다른 시점에 다른 일을 합니다.

## 관련 문서

- [Server and Client Components (동작 원리 + 합성 패턴)](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [React Server Components (React 공식 문서)](https://react.dev/reference/rsc/server-components)
- [`use client` 디렉티브](https://nextjs.org/docs/app/api-reference/directives/use-client)
- [`use-client` 직렬화 가능 타입 (React 공식 문서)](https://react.dev/reference/rsc/use-client)
