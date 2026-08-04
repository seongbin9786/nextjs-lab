# 18 — 동적 import와 지연 로딩

> 첫 화면에 필요 없는 코드를 분리해서 첫 로딩을 가볍게 합니다.

## 실행

```bash
pnpm install
node scripts/gen-big-data.mjs   # 170KB 더미 데이터 2벌 생성
pnpm dev                        # http://localhost:3000
bash scripts/compare-bundles.sh # 첫 로딩 JS 정량 비교
```

## 정량 측정 결과 (이 저장소에서 실제 측정, 2026-08)

각 페이지 HTML에서 실행되는 `<script src>`의 합계입니다.

| 라우트 | 방식 | 첫 로딩 JS |
| --- | --- | --- |
| `/static-import` | 정적 import | **705.6 kB** |
| `/lazy-load` | `next/dynamic` | **564.2 kB** |
| 차이 | | **141.4 kB** |

`/lazy-load`는 차트와 170KB 데이터를 첫 로딩에서 제외하고, 필요해질 때
별도 청크로 받습니다.

## 핵심 개념

```tsx
"use client";
import dynamic from "next/dynamic";

export const LazyChart = dynamic(
  () => import("@/components/heavy-lazy").then((m) => m.HeavyLazy),
  { loading: () => <p>불러오는 중…</p> },
);
```

`ssr: false`는 서버 렌더링을 건너뛰는 옵션으로, `window`를 렌더 경로에서
직접 쓰는 컴포넌트(`/no-ssr`)에 필요합니다. **클라이언트 파일에서만** 사용 가능.

## 함정: 공유 청크 승격 (이 예시가 데이터를 2벌 만든 이유)

같은 컴포넌트를 한 페이지는 정적으로, 다른 페이지는 동적으로 import하면
번들러가 그 컴포넌트를 **공유 청크**로 만들어 두 페이지 모두 첫 로딩에
싣습니다. 코드 분리 효과가 사라집니다.

실제로 처음 측정했을 때 두 페이지의 차이가 **-4kB(거의 없음)**였습니다.
두 페이지가 독립적인 컴포넌트/데이터를 쓰도록 바꾸자 141kB 차이가 드러났습니다.

미세한 디테일 하나 더: 지연 청크는 첫 HTML에
`<link rel="preload" fetchPriority="low">` 힌트로 걸립니다. 초기 렌더링을
막지 않으면서 브라우저가 한가할 때 미리 받아두는 용도입니다.

## 정량 비교: 언제 분리하나

| 상황 | 권장 |
| --- | --- |
| 첫 화면 핵심 UI | 정적 import |
| 조건부/아래 접힌 영역(차트, 에디터, 모달) | `next/dynamic` |
| SSR 불가능한 브라우저 전용 | `dynamic` + `ssr: false` |

## 좋은 활용 사례

- 무거운 서드파티(차트, 에디터, 지도)는 항상 지연 로딩
- `loading` 폴백으로 레이아웃 유지
- 뷰포트 진입 시 로딩은 `IntersectionObserver`와 조합

## DX 개선

- `React.lazy` + `Suspense` 배선이 `dynamic()` 한 줄로 축소
- SSR 여부, 로딩 폴백을 옵션으로 선언

## 관련 문서

- [Lazy Loading](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
