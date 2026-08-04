# 03 — 서버 vs 클라이언트 컴포넌트

> 모든 컴포넌트는 기본적으로 서버 컴포넌트. 상호작용이 필요할 때만 `"use client"`.

## 실행

```bash
pnpm install
node scripts/gen-catalog.mjs   # 번들 비교용 40KB 데이터 생성
pnpm dev                       # http://localhost:3000
bash scripts/compare-bundles.sh  # 번들 크기 정량 비교
```

## 페이지 구성

| 페이지 | 데모 |
| --- | --- |
| `/` | 서버 컴포넌트 기본 동작 (렌더링 시각이 서버에서 계산됨) |
| `/client-interactive` | `useState` + 버튼 — `"use client"` 필요 |
| `/server-only` | `node:fs`로 서버 파일 읽기 — 클라이언트 번들에 없음 |
| `/composition` | 서버 콘텐츠를 클라이언트 컴포넌트의 children으로 전달 |
| `/boundary` | 경계를 넘어갈 수 있는 props / 없는 props |
| `/compare` | 서버 합성 vs 전부-클라이언트 번들 크기 정량 비교 |

## 핵심 개념

### 기본은 서버, 선택이 클라이언트

```tsx
// 서버 컴포넌트 (기본) — 이 코드는 브라우저에 전송되지 않음
const data = await db.posts.findMany();

// 클라이언트 컴포넌트 — 파일 첫 줄에 선언
"use client";
const [count, setCount] = useState(0);
```

### 합성 패턴 (가장 중요)

클라이언트 컴포넌트는 서버 컴포넌트를 import할 수 없습니다. 대신:

```tsx
// 서버 컴포넌트(page)가 클라이언트 컴포넌트를 감싸고
// 서버에서 렌더링한 children을 흘려보냅니다.
<InteractiveCard title="...">
  <p>{serverData}</p>   {/* 서버에서 렌더링됨 */}
</InteractiveCard>
```

이렇게 하면 fs/DB 로직은 서버에 남고, 클라이언트 번들에는
인터랙션(접기/펼치기)만 포함됩니다.

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

## 좋은 활용 사례

- `page.tsx`는 항상 서버 컴포넌트로 유지
- 버튼/입력/차트 등 "잎사귀"만 `"use client"`
- 데이터는 서버에서 fetch해서 props로 전달 (클라이언트 fetch 워터폴 방지)
- 서버 전용 모듈 보호가 필요하면 [`server-only` 패키지](https://www.npmjs.com/package/server-only) 사용

## DX 개선

- 서버/클라이언트 구분 없이 한 파일에서 시작 → 필요할 때만 분리
- 데이터 fetching을 위한 `useEffect` + 상태 관리 보일러플레이트가 사라짐
- 비밀 키가 클라이언트로 새는 사고를 구조적으로 방지

## 관련 문서

- [Server Components](https://nextjs.org/docs/app/getting-started/server-components)
- [Client Components](https://nextjs.org/docs/app/getting-started/client-components)
- [Composition Patterns](https://nextjs.org/docs/app/getting-started/composition-patterns)
