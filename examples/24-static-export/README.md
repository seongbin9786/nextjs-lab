# 24 — 정적 export

> `output: "export"`로 순수 정적 파일(HTML/CSS/JS)을 만들어 아무 데나 배포합니다.

## 실행 / 빌드

```bash
pnpm install
pnpm build          # out/ 폴더에 정적 파일 생성
npx serve out       # 로컬에서 서빙 확인
```

## 핵심 개념

```ts
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },   // 이미지 최적화 API가 없으므로 필요
};
```

빌드하면 `out/`에 완성된 HTML이 생깁니다:

```
out/
  index.html
  blog/first.html     ← generateStaticParams로 생성
  blog/second.html
  client.html
```

## 쓸 수 있는 것 / 없는 것

| 가능 | 불가능 |
| --- | --- |
| 페이지, 레이아웃, 클라이언트 JS | Route Handlers, Server Actions |
| `generateStaticParams` SSG | `proxy.ts`/middleware |
| 정적 자산 서빙 | ISR, `cookies()`/`headers()` 읽기 |
| | 동적 렌더링 (`force-dynamic`) |

`/client` 페이지에서 보듯, 정적으로 내보내도 브라우저 인터랙션은 그대로
동작합니다 (사전 렌더링된 HTML + 하이드레이션).

## 정량 비교: 정적 export vs 서버 배포

| 항목 | 정적 export | 서버 배포 |
| --- | --- | --- |
| 호스팅 비용 | **CDN/무료 정적 호스팅 가능** | 서버 런타임 필요 |
| 확장성 | CDN이 자동 처리 | 인스턴스 확장 필요 |
| 보안 표면 | 공격 표면 최소 (서버 없음) | 서버 취약점 관리 필요 |
| 가능한 기능 | 정적 콘텐츠 한정 | 전체 |

## 좋은 활용 사례

- 마케팅 사이트, 문서, 포트폴리오, 랜딩 페이지
- 로그인/개인화/실시간 데이터가 없는 모든 사이트
- 처음엔 정적으로 시작 → 필요해지면 서버 기능 추가 (같은 코드베이스)

## DX 개선

- 배포가 "파일 복사" — 서버 프로세스 관리, 헬스체크, 스케일링 없음
- GitHub Pages/Netlify/S3 등 정적 호스팅과 바로 통합

## 관련 문서

- [Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
