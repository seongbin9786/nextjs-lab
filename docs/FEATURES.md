# Next.js 16 기능 전체 리스트

Next.js 16.3.0 기준, 공식 문서에서 추출한 기능 전체 목록입니다.
각 기능은 (1) 이 저장소의 예시로 다루거나 (2) 문서로 정리했습니다.

범례: ✅ = 예시 있음 (예시 번호) / 📄 = 문서 정리

---

## 1. 라우팅 (App Router)

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| 파일 시스템 라우팅 | 폴더/파일이 곧 URL | ✅ 01 |
| Pages (`page.tsx`) | URL의 화면 | ✅ 01 |
| Layouts (`layout.tsx`) | 재렌더링되지 않는 공통 UI | ✅ 01 |
| Templates (`template.tsx`) | 매 이동 재마운트되는 레이아웃 | ✅ 01 |
| Route Groups `(폴더)` | URL에 드러나지 않는 묶음 | ✅ 01 |
| Dynamic Routes `[id]` | URL 파라미터 | ✅ 02 |
| Catch-all `[...slug]` | 나머지 경로 배열 | ✅ 02 |
| Optional Catch-all `[[...slug]]` | 루트 경로도 매칭 | ✅ 02 |
| `generateStaticParams` | 빌드 시 파라미터 목록으로 SSG | ✅ 02, 19 |
| `notFound()` + `not-found.tsx` | 선언적 404 | ✅ 02, 14 |
| Loading UI (`loading.tsx`) | 자동 Suspense 경계 | ✅ 04 |
| Error UI (`error.tsx`) | 세그먼트 에러 경계 | ✅ 14 |
| Global Error (`global-error.tsx`) | 앱 전체 최후 방어선 | ✅ 14 |
| Link + prefetch | 자동 프리페칭, 16에서 레이아웃 중복 제거 | ✅ 01, 19 |
| Redirects (`redirect()`, config) | 리다이렉트 | ✅ 09, 16 |
| Rewrites | URL 유지 채 라우트 교체 | ✅ 09 |
| Parallel Routes (`@slot`) | 한 화면 다중 슬롯 | ✅ 15 |
| Intercepting Routes `(.)` | 내비게이션 가로채기 (모달) | ✅ 15 |
| `default.tsx` (16부터 슬롯마다 필수) | 병렬 슬롯 폴백 | ✅ 15 |
| Route Handlers (`route.ts`) | HTTP API 엔드포인트 | ✅ 08 |
| Proxy (`proxy.ts`, 구 middleware) | 요청 전처리 게이트웨이 | ✅ 09 |
| Shallow Routing (Pages Router) | Pages Router 전용 — App Router 불필요 | 📄 |

## 2. 렌더링

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| React Server Components | 서버 기본 렌더링, JS 미전송 | ✅ 03 |
| Client Components (`"use client"`) | 브라우저 상호작용 | ✅ 03 |
| Composition Patterns | 서버→클라이언트 children 합성 | ✅ 03 |
| Async params/searchParams/cookies/headers | 15+ Promise API (16에서 동기 접근 제거) | ✅ 02, 05, 09 |
| Static Rendering (SSG) | 빌드 시 HTML 생성 | ✅ 02 |
| Dynamic Rendering (SSR) | 요청 시 렌더링 | ✅ 05, 25 |
| Streaming + Suspense | 준비된 부분부터 HTML 전송 | ✅ 04 |
| Incremental Static Regeneration | 정적 페이지 주기 재생성 | ✅ 05 |
| Partial Prerendering (PPR) | 정적 셸 + 동적 구멍 | ✅ 06 |
| Cache Components (`"use cache"`) | 16의 명시적 캐싱 모델 | ✅ 06 |
| `connection()` | 요청 시 렌더링 선언 | ✅ 06 |
| `instant` 세그먼트 설정 | 즉시 내비게이션 검증 opt-out | ✅ 06 |
| View Transitions | 화면 전환 애니메이션 (React 19.2) | ✅ 19 |
| React 19.2 (`useEffectEvent`, `<Activity>`) | canary 기능 | 📄 |
| React Compiler | 자동 메모이제이션 (`reactCompiler: true`) | 📄 |

## 3. 데이터 Fetching과 캐싱

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| `fetch` (기본 no-store) | 15+ 캐시 없음이 기본 | ✅ 05 |
| `cache: "force-cache"` | 데이터 캐시 영구 저장 | ✅ 05 |
| `next.revalidate` | 시간 기반 재검증 | ✅ 05 |
| `next.tags` + `revalidateTag(tag, profile)` | 태그 무효화 (16: 프로필 필수) | ✅ 05, 06 |
| `updateTag(tag)` | Server Action 전용 read-your-writes | ✅ 06 |
| `refresh()` | Server Action 전용 비캐시 데이터 갱신 | 📄 |
| `revalidatePath` | 경로 기준 무효화 | ✅ 05 |
| Request Memoization | 렌더 내 fetch 중복 제거 | ✅ 05 |
| Data Cache | fetch 응답 서버 저장 계층 | ✅ 05 |
| Full Route Cache | 렌더링 결과(HTML) 저장 | ✅ 05 |
| Router Cache | 클라이언트 내비게이션 캐시 | 📄 |
| `cacheLife()` / `cacheTag()` | Cache Components 수명/태그 API | ✅ 06 |
| `"use cache"` 함수/페이지/컴포넌트 | 캐시 경계 선언 | ✅ 06 |
| `use cache: remote` | 내구성 캐시 저장소 | 📄 |
| Draft Mode | CMS 미리보기용 캐시 우회 | 📄 |
| `generateStaticParams` + 셸 프리렌더 | 알려지지 않은 파라미터는 셸만 프리렌더 | ✅ 06 |

## 4. 변형 (Mutations)

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Server Actions (`"use server"`) | 서버 함수 호출 | ✅ 07 |
| 폼 `action` 통합 | 네이티브 폼 제출 | ✅ 07 |
| `useActionState` | 액션 결과/에러 상태 | ✅ 07, 20 |
| `useFormStatus` | 제출 중 상태 | ✅ 07 |
| `useOptimistic` | 낙관적 UI | ✅ 07 |
| Progressive Enhancement | JS 없이도 폼 동작 | ✅ 07 |
| 단일 왕복 응답 모델 (16) | 액션+갱신이 한 응답 | ✅ 07 |

## 5. 캐싱 API (16 신규)

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| `revalidateTag(tag, profile)` | SWR 무효화, 프로필 필수 | ✅ 05, 06 |
| `updateTag(tag)` | 즉시 재읽기 (Action 전용) | ✅ 06 |
| `refresh()` | 비캐시 데이터 갱신 (Action 전용) | 📄 |
| `cacheLife` 프로필 (`seconds`~`max`) | 내장 수명 프로필 | ✅ 06 |
| 커스텀 프로필 | `next.config` 정의 | 📄 |

## 6. 최적화

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Image (`next/image`) | 리사이즈/포맷/지연로딩/CLS 방지 | ✅ 10 |
| `images.formats` (AVIF/WebP) | 포맷 협상 | ✅ 10 |
| `images.localPatterns` (16) | 쿼리스트링 로컬 이미지 보호 | 📄 |
| Font (`next/font`) | 자체 호스팅 + CLS 제거 | ✅ 11 |
| Script (`next/script`) | 서드파티 로드 전략 | ✅ 12 |
| Dynamic Import (`next/dynamic`) | 코드 분할/지연 로딩 | ✅ 18 |
| Lazy Loading (React.lazy) | 클라이언트 지연 로딩 | ✅ 18 |
| Metadata API | title/description/OG 타입 관리 | ✅ 13 |
| `generateMetadata` | 동적 메타데이터 | ✅ 13 |
| `opengraph-image.tsx` | 코드 OG 이미지 생성 | ✅ 13 |
| `sitemap.ts` / `robots.ts` / `manifest.ts` | SEO 파일 규칙 | ✅ 13 |
| JSON-LD | 구조화 데이터 | ✅ 13 |
| Bundle Analyzer | 번들 분석 | 📄 |
| `@next/third-parties` | GA/GTM 등 최적 로딩 | 📄 |
| Videos 최적화 | 영상 서빙 가이드 | 📄 |
| Memory Usage 최적화 | 메모리 관리 가이드 | 📄 |

## 7. 스타일링

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Global CSS | 전역 스타일 | ✅ 21 |
| CSS Modules | 자동 스코프 | ✅ 21 |
| Tailwind CSS (v4) | 유틸리티 퍼스트 | ✅ 21 |
| Sass | `.scss` 지원 | 📄 |
| CSS-in-JS | styled-components 등 (RSC 주의) | ✅ 21 |

## 8. 인증과 보안

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| 인증 패턴 (쿠키 세션) | 로그인/세션/보호 라우트 | ✅ 20 |
| Proxy 낙관적 게이트 | 빠른 리다이렉트 + 서버 재검증 | ✅ 20 |
| `httpOnly`/`sameSite` 쿠키 | 쿠키 보안 옵션 | ✅ 20 |
| Data Security | 시크릿 노출 방지 원칙 | ✅ 17, 20 |
| Content Security Policy | CSP 헤더 구성 | 📄 |
| Session Management (Auth.js) | 라이브러리 연동 | 📄 |

## 9. 국제화 (i18n)

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Locale Routing (`[locale]`) | URL 기반 언어 라우팅 | ✅ 16 |
| Locale 감지/리다이렉트 | `Accept-Language` 기반 | ✅ 16 |
| Dictionary 패턴 | 언어별 문자열 관리 | ✅ 16 |
| `hreflang` alternates | 검색엔진 언어 알림 | ✅ 16 |

## 10. 설정과 환경

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| `.env` 파일 로딩 | 자동 로드 + 우선순위 | ✅ 17 |
| `NEXT_PUBLIC_` 접두사 | 클라이언트 인라인 변수 | ✅ 17 |
| 서버 전용 변수 | 번들 제외 | ✅ 17 |
| 런타임 환경 변수 | 배포 시 주입 | ✅ 17 |
| `next.config.ts` | 프레임워크 설정 | ✅ 06, 10, 24, 25 |
| Path Aliases (`@/*`) | import 별칭 | ✅ 전체 |
| `cacheComponents` | Cache Components 플래그 | ✅ 06 |
| `output: "export"` / `"standalone"` | 배포 모드 | ✅ 24, 25 |

## 11. 테스트와 품질

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Vitest / Jest 설정 | 컴포넌트/단위 테스트 | 📄 |
| Playwright / Cypress | E2E 테스트 | 📄 |
| TypeScript 통합 | 타입 체크 빌드 내장 | ✅ 전체 |
| ESLint / Biome | 16부터 `next lint` 제거, 직접 실행 | 📄 |

## 12. DX와 관측성

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Turbopack (기본 번들러) | 빌드 2~5배, Refresh 최대 10배 | ✅ 22 |
| Turbopack 파일 시스템 캐시 (beta) | dev 재시작 가속 | ✅ 22 |
| `next dev`/`build` 단계별 시간 출력 | 터미널 DX | ✅ 22 |
| 동시 실행 락파일 | dev/build 충돌 방지 | 📄 |
| Instrumentation (`register`) | 서버 시작 훅 | ✅ 23 |
| `onRequestError` | 요청 에러 가로채기 | ✅ 23 |
| OpenTelemetry | 자동 span + APM 연동 | ✅ 23 |
| DevTools MCP | AI 디버깅 통합 (16 신규) | 📄 |
| Debugging (VS Code/Chrome) | 디버거 구성 | 📄 |
| Codemods / Upgrade CLI | 자동 마이그레이션 | 📄 |

## 13. 배포와 운영

| 기능 | 설명 | 상태 |
| --- | --- | --- |
| Static Export | 정적 파일 배포 | ✅ 24 |
| Standalone Output | 최소 서버 번들 | ✅ 25 |
| Docker 배포 | 멀티스테이지 이미지 | ✅ 25 |
| Self-Hosting (Node) | 자체 서버 운영 | ✅ 25 |
| Vercel / 플랫폼 배포 | Build Adapters (alpha) | 📄 |
| Multi-Zones | 마이크로 프론트엔드 | 📄 |
| Multi-tenant | 테넌트 라우팅 | 📄 |
| PWA / 오프라인 | 매니페스트 + SW | 📄 (manifest는 ✅ 13) |
| SPA 모드 | 클라이언트 전용 렌더링 | 📄 |
| Custom Server | 서버 프로그래밍 제어 | 📄 |
| MDX | 마크다운 + JSX | 📄 |
| Analytics (Speed Insights) | 성능 측정 | 📄 |
| CI Build Caching | CI 빌드 캐시 | 📄 |

---

## 예시 → 기능 역매핑

각 예시가 어느 기능을 다루는지:

- **01**: 라우팅 기초, Link, not-found
- **02**: 동적 라우트 전 패턴, generateStaticParams
- **03**: RSC/클라이언트 경계와 합성
- **04**: 스트리밍, Suspense, loading
- **05**: fetch 캐시 3종, 메모이제이션, ISR
- **06**: Cache Components, PPR, 캐싱 API 3형제
- **07**: Server Actions 훅 3종
- **08**: Route Handlers, SSE, CORS, 웹훅
- **09**: proxy.ts 전 기능
- **10**: next/image + 포맷/크기 정량
- **11**: next/font + CLS
- **12**: next/script 전략
- **13**: Metadata/SEO 파일 규칙 전부
- **14**: 에러 파일 규칙 3종
- **15**: 병렬 + 인터셉팅 라우트
- **16**: i18n 라우팅
- **17**: 환경 변수 3성격
- **18**: 코드 분할 + 번들 정량
- **19**: View Transitions 패턴
- **20**: 인증 세션 패턴
- **21**: 스타일링 3방식
- **22**: Turbopack 정량
- **23**: instrumentation/OTel
- **24**: 정적 export
- **25**: standalone + Docker
