# nextjs-lab

Next.js 16의 기능을 **기능별 standalone 예시 앱 + 한국어 해설 + 정량 비교**로 정리한 저장소입니다.

- 모든 예시는 **독립 실행**(각 폴더가 자기 `package.json`을 가진 완전한 앱)
- 모든 예시는 **Next.js 16.3.0 + React 19.2 + TypeScript** 기준, `pnpm build` 통과 검증됨
- 주요 최적화는 **직접 측정한 숫자**로 장점을 보여줌 (TTFB, 전송 바이트, 번들 크기, 빌드 시간)

## 빠른 시작

```bash
cd examples/01-app-router-basics   # 아무 예시나
pnpm install
pnpm dev                            # http://localhost:3000
```

전체 설치/빌드:

```bash
./scripts/install-all.sh
./scripts/build-all.sh
./scripts/smoke-test.sh   # 25개 예시를 실제 서버로 띄워 HTTP 응답 확인
```

## 예시 목록

### 라우팅

| # | 예시 | 핵심 기능 |
| --- | --- | --- |
| 01 | [app-router-basics](./examples/01-app-router-basics) | 파일 시스템 라우팅, layout/template, route group, not-found |
| 02 | [dynamic-routes](./examples/02-dynamic-routes) | `[id]`, 캐치올, `generateStaticParams`, async params |
| 09 | [proxy](./examples/09-proxy) | `proxy.ts`(middleware 후신), 헤더/리다이렉트/리라이트/게이트 |
| 15 | [parallel-intercepting-routes](./examples/15-parallel-intercepting-routes) | `@slot`, `(.)` 인터셉팅, 모달 패턴 |
| 16 | [i18n](./examples/16-i18n) | `[locale]` 다국어 라우팅, hreflang |

### 렌더링과 데이터

| # | 예시 | 핵심 기능 |
| --- | --- | --- |
| 03 | [server-client-components](./examples/03-server-client-components) | RSC vs `"use client"`, 합성 패턴, 서버 전용 코드 |
| 04 | [streaming-suspense](./examples/04-streaming-suspense) | Suspense, `loading.tsx`, 스트리밍 — **TTFB 250배 측정** |
| 05 | [data-fetching-caching](./examples/05-data-fetching-caching) | fetch 캐시 옵션, 태그, ISR, 요청 메모이제이션 |
| 06 | [cache-components](./examples/06-cache-components) | **Next.js 16** `"use cache"`, PPR, `updateTag` |
| 14 | [error-handling](./examples/14-error-handling) | `error.tsx` 경계, `not-found.tsx`, `global-error.tsx` |

### 서버 로직

| # | 예시 | 핵심 기능 |
| --- | --- | --- |
| 07 | [server-actions](./examples/07-server-actions) | 폼 액션, `useActionState`/`useFormStatus`/`useOptimistic` |
| 08 | [route-handlers](./examples/08-route-handlers) | API 라우트, SSE 스트리밍, CORS, 웹훅 서명 검증 |
| 20 | [auth-patterns](./examples/20-auth-patterns) | 세션 쿠키 + 서명 토큰 + proxy 게이트 + 이중 검증 |

### 최적화

| # | 예시 | 핵심 기능 |
| --- | --- | --- |
| 10 | [image-optimization](./examples/10-image-optimization) | `next/image` — **전송량 최대 245배 절감 측정** |
| 11 | [font-optimization](./examples/11-font-optimization) | `next/font` 자체 호스팅, CLS 제거, 요청 0개 |
| 12 | [script-optimization](./examples/12-script-optimization) | `next/script` 로드 전략 4가지 |
| 13 | [metadata-seo](./examples/13-metadata-seo) | metadata API, OG 이미지 생성, sitemap/robots/JSON-LD |
| 18 | [dynamic-imports](./examples/18-dynamic-imports) | `next/dynamic`, `ssr: false` — **첫 로딩 JS 141kB 절감 측정** |
| 19 | [view-transitions](./examples/19-view-transitions) | React 19.2 `ViewTransition`, 공유 요소 모프 |

### 스타일링 / 설정 / DX / 배포

| # | 예시 | 핵심 기능 |
| --- | --- | --- |
| 17 | [env-variables](./examples/17-env-variables) | `.env` 우선순위, 서버 전용 vs `NEXT_PUBLIC_` vs 런타임 |
| 21 | [styling](./examples/21-styling) | CSS Modules + Tailwind v4 공존, CSS-in-JS 기준 |
| 22 | [turbopack-dx](./examples/22-turbopack-dx) | Turbopack vs webpack — **빌드 3.3배, dev 2.3배 측정** |
| 23 | [instrumentation](./examples/23-instrumentation) | `register()`, `onRequestError()`, OpenTelemetry |
| 24 | [static-export](./examples/24-static-export) | `output: "export"` 정적 배포 |
| 25 | [standalone-docker](./examples/25-standalone-docker) | `output: "standalone"` + 멀티스테이지 Dockerfile |

## 정량 측정 요약

| 측정 | 결과 | 재현 스크립트 |
| --- | --- | --- |
| 스트리밍 TTFB | 블로킹 2.01s → 스트리밍 0.007s | `examples/04-.../scripts/bench.sh` |
| 데이터 캐시 TTFB | 미캐시 167~228ms → 캐시 적중 7~10ms | `examples/05-.../scripts/bench.sh` |
| 서버 vs 클라이언트 번들 | 전부 클라이언트가 56.2kB 더 무거움 | `examples/03-.../scripts/compare-bundles.sh` |
| 이미지 전송량 | 1747KB → AVIF 7KB (245배) | `examples/10-.../scripts/bench.sh` |
| 지연 로딩 번들 | 첫 로딩 JS 705.6kB → 564.2kB | `examples/18-.../scripts/compare-bundles.sh` |
| Turbopack 빌드 | 2.14s vs webpack 7.06s (3.3배) | `examples/22-.../scripts/bench.sh` |

전체 벤치 일괄 실행: `./scripts/bench-all.sh`

측정 환경: MacBook (darwin), Node 20.18.1, Next.js 16.3.0, 2026-08.

## 기능 전체 리스트

예시로 다루지 못한 기능까지 포함해 Next.js 16 기능 전체를 정리한 문서는
[docs/FEATURES.md](./docs/FEATURES.md)에 있습니다.

## 요구 사항

- Node.js 20.9+ (Next.js 16 최소 요구)
- pnpm (npm/yarn도 가능 — 각 예시는 표준 Node 프로젝트입니다)

## 참고

- 예시들은 교육용입니다. 인메모리 "데이터베이스", 데모용 비밀 값 등
  프로덕션에 그대로 쓰면 안 되는 패턴이 의도적으로 포함되어 있습니다.
- [Next.js 공식 문서](https://nextjs.org/docs)와 [Next.js 16 릴리스 노트](https://nextjs.org/blog/next-16)를 함께 보세요.

## 라이선스

MIT
