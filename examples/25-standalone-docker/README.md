# 25 — standalone과 Docker

> `output: "standalone"`으로 최소 서버 번들을 만들고, 멀티스테이지 Dockerfile로 배포합니다.

## 실행

```bash
pnpm install

# Docker로
docker build -t nextjs-lab-standalone .
docker run -p 3000:3000 nextjs-lab-standalone

# 또는 Docker 없이 standalone 확인
pnpm build
node .next/standalone/server.js
```

## 핵심 개념

```ts
// next.config.ts
const nextConfig: NextConfig = { output: "standalone" };
```

빌드하면 `.next/standalone/`에 **서버 실행에 필요한 최소 모듈**만
트리셰이킹되어 담깁니다. `node_modules` 전체를 복사하지 않아도 됩니다.

### 멀티스테이지 Dockerfile

```dockerfile
FROM node:20-alpine AS deps      # 의존성 설치 (캐시)
FROM node:20-alpine AS builder   # 빌드
FROM node:20-alpine AS runner    # 실행 — standalone만 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]
```

## 주의: static과 public은 직접 복사

standalone 출력에는 `.next/static`과 `public`이 **자동 포함되지 않습니다**.
Dockerfile처럼 별도로 복사해야 정적 에셋이 서빙됩니다.

## 정량 비교: 이미지 크기

| 방식 | 최종 이미지에 포함 |
| --- | --- |
| `node_modules` 전체 복사 | 수백 MB (전체 의존성) |
| `output: "standalone"` | 서버 실행 최소 모듈만 — **수십 MB 이하** |

이미지가 작으면 푸시/풀이 빠르고 공격 표면도 줄어듭니다.
`/server-time` 페이지에서 매 요청 서버 렌더링이 살아 있는지 확인할 수 있습니다.

## 좋은 활용 사례

- 서버 기능이 필요한 앱을 컨테이너로 배포 (정적 export로 안 되는 경우)
- Kubernetes/ECS 등 컨테이너 오케스트레이션
- `PORT`, `HOSTNAME` 환경 변수로 런타임 제어

## DX 개선

- 프레임워크가 서버 번들링을 자동 처리 — 수동 트리셰이킹 불필요
- 표준 `server.js` 진입점이라 어떤 컨테이너 플랫폼에든 그대로 배포

## 관련 문서

- [Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Deploying](https://nextjs.org/docs/app/building-your-application/deploying)
