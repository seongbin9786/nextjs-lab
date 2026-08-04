# 11 — 폰트 최적화 (next/font)

> 웹 폰트 자체 호스팅 + 레이아웃 이동(CLS) 제거 + 외부 요청 0개.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

- `/` — `next/font/local`로 IBM Plex Sans KR 로드 (외부 요청 0)
- `/how` — 빌드 시 일어나는 일, CLS 제거 원리
- `/cdn` — 고전 방식(`<link>` 구글 Fonts)과의 비교

## 정량 비교: 로딩 방식

| 방식 | 외부 origin 요청 | 폰트 발견 시점 |
| --- | --- | --- |
| `<link>` 구글 Fonts | **2회+** (CSS → woff2, 직렬) | CSS 도착 후 |
| `next/font` | **0회** (폰트는 같은 origin) | HTML과 함께 preload (병렬) |

`/cdn` 페이지와 홈을 각각 DevTools → Network로 비교하면
`fonts.googleapis.com`, `fonts.gstatic.com` 요청 유무가 갈립니다.

## 핵심 개념

```tsx
import localFont from "next/font/local";

const plex = localFont({
  src: "../public/fonts/ibm-plex-sans-kr-400.woff2",
  display: "swap",
  variable: "--font-plex",   // CSS 변수로 내보냄
});

// layout.tsx
<html className={plex.variable}>
```

구글 폰트를 자체 호스팅하려면 `next/font/google`:

```tsx
import { Noto_Sans_KR } from "next/font/google";
const noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "700"] });
// 빌드 때 폰트 파일을 다운로드해 내 앱에 포함 — 런타임에 외부 요청 없음
```

## 왜 CLS가 사라지나

폰트가 늦게 도착하면 fallback → 웹 폰트 교체 순간 텍스트가 움직입니다.
next/font는 fallback에 `size-adjust`/`ascent-override`를 적용해 두 폰트가
차지하는 공간을 맞추므로 **교체돼도 레이아웃이 흔들리지 않습니다.**

## 좋은 활용 사례

- 본문 폰트는 `next/font/google`의 자체 호스팅 (개인정보/방화벽 이슈도 줄음)
- `variable`로 CSS 변수화해 전역에서 재사용
- 한글 폰트는 파일이 크므로 필요한 weight만 선택 (400/700 정도)

## DX 개선

- `@font-face` 수동 작성 + preload 관리가 선언문 하나로 축소
- 제로 런타임: CSS는 빌드 때 생성, 클라이언트 JS 비용 0

## 관련 문서

- [Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
