# 25 — standalone과 Docker

> `output: "standalone"`으로 최소 서버 번들을 만들고, 멀티스테이지 Dockerfile로 배포합니다.

서버 기능이 필요한 앱을 컨테이너로 배포할 때의 표준 구성입니다.
`output: "standalone"`이 "서버를 실행하는 데 실제로 필요한 파일"만 골라
최소 번들을 만들고, 멀티스테이지 Dockerfile이 그 번들만 최종 이미지에
담습니다.

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

Docker 없이 실행할 때도 포트와 호스트를 지정할 수 있습니다. 공식 문서의
권장 방식대로 환경 변수를 씁니다:

```bash
PORT=8080 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

## 이 예시가 보여주는 것

| 파일 | 보여주는 것 |
| --- | --- |
| `next.config.ts` | `output: "standalone"` 설정 한 줄 |
| `Dockerfile` | deps → builder → runner 3단계 멀티스테이지 빌드 |
| `.dockerignore` | 빌드 컨텍스트에서 제외할 것들 |
| `app/server-time/page.tsx` | `force-dynamic` 페이지로 매 요청 서버 렌더링 확인 |
| `.next/standalone/` | 파일 트레이싱이 만들어낸 최소 서버 번들 |

## 동작 원리

### output:"standalone"은 어떻게 최소 번들을 만드나

핵심은 **파일 트레이싱(Output File Tracing)** 입니다. `next build` 중에
Next.js는 [`@vercel/nft`](https://github.com/vercel/nft)로 각 페이지와 그
의존성을 정적 분석합니다. `import`, `require`, `fs` 사용 흔적을 따라가면서
"프로덕션 서버가 이 페이지를 서빙할 때 실제로 불러올 수 있는 파일" 목록을
만듭니다. 프로덕션 서버 자체도 추적 대상이라 서버 실행에 필요한 파일 목록도
함께 나옵니다 (`.next/next-server.js.nft.json`).

이전에는 Docker로 배포하려면 `next start`를 돌리기 위해 `dependencies` 전체를
이미지에 넣어야 했습니다. 트레이싱 덕분에 그 목록에서 **실제로 쓰이는 파일만
골라** `.next/standalone/` 폴더에 복사할 수 있게 됐습니다. 이 폴더는
`node_modules`를 설치하지 않은 상태로도 그대로 배포할 수 있습니다.

이 예시를 빌드한 뒤 실제로 측정한 크기입니다 (로컬, `du -sh`):

| 대상 | 크기 |
| --- | --- |
| `node_modules` 전체 | 344M |
| `.next/standalone` 전체 | 37M |
| 그중 `standalone/node_modules` | 36M |

이 예시는 의존성이 next, react, react-dom뿐이라 `standalone/node_modules`의
최상위 폴더도 이 3개만 남습니다. 의존성이 많은 실제 프로젝트에서도 원리는
같습니다 — 트레이싱이 닿지 않는 패키지는 번들에 들어가지 않습니다.

`standalone/` 폴더의 구조는 이렇습니다:

```
.next/standalone/
  server.js          ← node로 직접 실행하는 진입점
  package.json
  node_modules/      ← 트레이싱으로 추려진 최소 모듈
  .next/             ← 매니페스트 + 서버 코드
    BUILD_ID, required-server-files.json,
    routes-manifest.json, prerender-manifest.json, server/ ...
```

주의할 점: `standalone/.next/` 안에는 매니페스트와 서버 번들만 있고
**`static/` 폴더는 없습니다**. 이것이 아래 "static과 public은 직접 복사"
절의 이유입니다.

### server.js를 node로 직접 실행하는 구조

`standalone/server.js`는 `next start`를 대체하는 최소 서버입니다. 이 예시의
빌드 결과물을 보면 하는 일이 명확합니다.

1. `NODE_ENV`를 `production`으로 고정하고, `PORT`(기본 3000)와
   `HOSTNAME`(기본 `0.0.0.0`)을 환경 변수에서 읽습니다.
2. 빌드 시점의 `next.config` 전체를 JSON으로 내장해서
   `__NEXT_PRIVATE_STANDALONE_CONFIG`에 담습니다 — 설정 파일을 다시 읽을
   필요가 없습니다.
3. `next` 패키지 내부의 `startServer`를 호출해 서버를 띄웁니다.

즉 `next` CLI도, 프로젝트의 나머지 파일도 필요 없습니다. `node server.js`
한 줄이면 프로덕션 서버가 뜹니다. 컨테이너 오케스트레이터가 보기에 이보다
단순한 워크로드는 없습니다.

### public/과 .next/static은 왜 수동 복사하나

공식 문서의 설명은 이렇습니다: 최소 서버는 `public` 폴더와 `.next/static`
폴더를 기본적으로 복사하지 않는데, **이 정적 파일들은 원래 CDN이 서빙하는
것이 이상적이기 때문**입니다. 즉 "빠진 것"이 아니라 의도적인 설계입니다.

CDN 없이 서버가 직접 서빙해야 한다면 수동으로 복사하면 되고, 복사한 뒤에는
`server.js`가 자동으로 서빙합니다:

```bash
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
```

복사 위치를 헷갈리지 마세요. `public`은 `standalone/public`로, `static`은
`standalone/.next/static`으로 갑니다.

### 멀티스테이지 Dockerfile은 왜 스테이지를 나누나

도커 이미지는 레이어가 쌓이는 구조라, "빌드에 필요한 것"과 "실행에 필요한
것"을 한 레이어에 섞으면 실행에 필요 없는 것까지 최종 이미지에 남습니다.
스테이지를 나누면 **최종 이미지에 마지막 스테이지가 선택한 파일만** 담을 수
있습니다.

| 스테이지 | 역할 | 다음 스테이지로 넘기는 것 |
| --- | --- | --- |
| `deps` | lockfile 기준 의존성 설치 | `node_modules` |
| `builder` | 소스를 복사해 `next build` 실행 | `.next/standalone` 등 빌드 결과 |
| `runner` | standalone 출력만 복사해 실행 | (최종 이미지) |

이렇게 나눴을 때 얻는 것은 세 가지입니다.

1. **이미지 크기와 공격 표면 감소** — 최종 이미지에는 의존성 설치 캐시,
   빌드 도구, 소스 코드, devDependencies가 남지 않습니다. standalone으로
   추려진 최소 모듈과 정적 파일뿐입니다.
2. **레이어 캐시** — `deps` 스테이지는 `package.json`/lockfile이 안 바뀌면
   캐시를 재사용합니다. 소스만 바꾼 빌드에서 의존성 설치를 건너뜁니다.
3. **빠른 푸시/풀** — 이미지가 작으니 레지스트리 전송과 컨테이너 시작이
   빠릅니다.

이 예시의 Dockerfile은 여기에 비루트 사용자(`nextjs`) 생성,
`NEXT_TELEMETRY_DISABLED=1`, `PORT`/`HOSTNAME` 고정까지 포함합니다.

## 코드와 함께 보는 설명

### `next.config.ts`

```ts
// next.config.ts
// output: "standalone" 은 프로덕션 서버를 실행하는 데 필요한 최소한의
// 파일만 .next/standalone 에 묶어줍니다. node_modules 전체를 복사하지
// 않아도 되어 Docker 이미지가 크게 작아집니다.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

### `Dockerfile` — 1단계 deps

```dockerfile
# Dockerfile (1단계)
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm || npm i -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

lockfile만 먼저 복사해서 설치하는 것이 포인트입니다. 소스를 바꾸지 않는 한
이 레이어는 캐시됩니다. `--frozen-lockfile`은 lockfile과 다른 설치를 막습니다.
lockfile이 `package.json`과 맞지 않으면 이미지 빌드가 실패합니다. 일반 install로
넘어가는 fallback을 두지 않는 이유는, 그 경우 lockfile과 다른 버전이 조용히
설치되기 때문입니다.

### `Dockerfile` — 2단계 builder

```dockerfile
# Dockerfile (2단계)
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm || npm i -g pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build
```

`deps`에서 만든 `node_modules`를 가져와 빌드합니다. 여기서
`.next/standalone`이 만들어집니다. 빌드가 실패하면 이미지 빌드 자체가
실패하므로, 실패한 결과물이 최종 이미지로 넘어가는 일은 없습니다.

### `Dockerfile` — 3단계 runner

```dockerfile
# Dockerfile (3단계, 일부)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

세 개의 `COPY --from=builder`가 이 예시의 전부입니다. standalone 출력,
그리고 수동 복사가 필요한 `static`과 `public`. 소스 코드도, `node_modules`
전체도 복사하지 않습니다. 비루트 사용자(`nextjs`)로 실행해 컨테이너가
뚫렸을 때의 피해 반경도 줄입니다. 복사할 때 `--chown=nextjs:nodejs`로 소유자를
바꾸는 이유는, 런타임에 `.next/cache`(ISR, 이미지 최적화 캐시)에 써야 하기
때문입니다. root 소유로 두면 이 쓰기가 `EACCES`로 실패합니다.

### `app/server-time/page.tsx` — 서버가 살아 있는 증거

```tsx
// app/server-time/page.tsx
export const dynamic = "force-dynamic";

export default function ServerTimePage() {
  const now = new Date().toLocaleTimeString("ko-KR", { hour12: false });
  // ... 서버 시각 표시
}
```

`force-dynamic`이라 매 요청 서버에서 렌더링됩니다. 새로고침할 때마다 시각이
바뀌면 컨테이너 안의 서버가 요청을 처리하고 있다는 증거입니다. 정적
export(24 예시)로는 이런 페이지를 만들 수 없습니다.

### `.dockerignore`

```
node_modules
.next
.git
*.md
Dockerfile
.dockerignore
```

호스트의 `node_modules`와 `.next`가 빌드 컨텍스트로 들어가면 전송이 느려지고
호스트 산출물이 이미지로 새어 들어갈 수 있으니 제외합니다.

## 정량 비교: 이미지 크기

| 방식 | 최종 이미지에 포함 |
| --- | --- |
| `node_modules` 전체 복사 | 수백 MB (전체 의존성) |
| `output: "standalone"` | 서버 실행 최소 모듈만 — **수십 MB 이하** |

이 예시 로컬 측정으로도 `node_modules` 전체 344M 대비
`.next/standalone` 37M입니다. 이미지가 작으면 푸시/풀이 빠르고 공격 표면도
줄어듭니다. `/server-time` 페이지에서 매 요청 서버 렌더링이 살아 있는지
확인할 수 있습니다.

## 좋은 활용 사례

- 서버 기능이 필요한 앱을 컨테이너로 배포 (정적 export로 안 되는 경우)
- Kubernetes/ECS 등 컨테이너 오케스트레이션
- `PORT`, `HOSTNAME` 환경 변수로 런타임 제어
- 런타임 환경 변수 주입 — 서버에서 동적 렌더링 시점에 읽는 환경 변수는 빌드
  이미지에 구워지지 않으므로, 같은 이미지 하나를 개발/스테이징/운영에 그대로
  승격(promote)할 수 있습니다
- 여러 인스턴스를 띄울 때는 빌드 ID를 고정(`generateBuildId`)해 모든
  컨테이너가 같은 빌드를 서빙하게 맞추기

## DX 개선

- 프레임워크가 서버 번들링을 자동 처리 — 수동 트리셰이킹 불필요
- 표준 `server.js` 진입점이라 어떤 컨테이너 플랫폼에든 그대로 배포

## 흔한 오해와 주의점

1. **static/public 복사를 빼먹으면 화면이 깨집니다.** 가장 흔한 사고입니다.
   HTML은 나오는데 JS/CSS/이미지가 404입니다. `standalone/.next/`에는
   `static/`이 없고 `public/`도 없습니다 — Dockerfile의 `COPY` 두 줄이 그
   역할입니다.
2. **runner 스테이지에 소스를 통째로 복사하면 멀티스테이지가 무의미해집니다.**
   `COPY --from=builder /app .` 같은 줄을 넣으면 빌드 캐시와 소스가 최종
   이미지에 다시 들어갑니다. 복사할 것은 standalone 출력과 static, public
   셋뿐입니다.
3. **트레이싱이 놓치는 파일이 있을 수 있습니다.** 동적으로 불러오는 네이티브
   모듈이나 런타임에 읽는 데이터 파일이 누락되면
   `outputFileTracingIncludes`로 명시적으로 포함시킬 수 있습니다. 반대로
   불필요한 파일은 `outputFileTracingExcludes`로 뺍니다. 모노레포에서는
   트레이싱 루트가 앱 폴더가 되므로, 바깥 파일을 포함하려면
   `outputFileTracingRoot`를 설정해야 합니다.
4. **여러 인스턴스 운영 시 캐시는 기본적으로 공유되지 않습니다.** ISR/캐시는
   각 인스턴스의 파일시스템에 저장됩니다. 컨테이너를 여러 개 띄우면 인스턴스
   간에 다른 버전의 페이지가 서빙될 수 있으니, 커스텀 캐시 핸들러(Redis 등)로
   공유 캐시를 구성해야 합니다.
5. **서버 종료는 SIGTERM으로 정중하게.** `after()` 같은 백그라운드 작업을
   쓴다면, 컨테이너 종료 시 SIGINT/SIGTERM을 보내고 종료 대기 시간을 충분히
   줘야(공식 문서는 10~30초 권장) 진행 중인 요청과 후처리 작업이 끝난 뒤
   프로세스가 종료됩니다.

## 관련 문서

- [Self-Hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Deploying](https://nextjs.org/docs/app/getting-started/deploying)
- [output 설정](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) — 파일 트레이싱 원리, `outputFileTracing*` 옵션
- [with-docker 공식 예시](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
