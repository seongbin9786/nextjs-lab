# 23 — instrumentation과 OpenTelemetry

> 서버 시작 시 초기화 훅(`register`)과 요청 에러 가로채기(`onRequestError`).

## 실행

```bash
pnpm install
pnpm dev   # 터미널 로그를 함께 보세요
```

1. 서버 시작 시 터미널에 `[instrumentation] register() 실행됨` 출력
2. `/crash?boom=1` 접속 → `[instrumentation] 요청 에러: GET /crash — ...` 출력

## 핵심 개념

```ts
// instrumentation.ts (프로젝트 루트)
export async function register() {
  // 서버 시작 시 1회: DB 풀 준비, OTel SDK 등록
}

export function onRequestError(err, request) {
  // 요청 중 잡히지 않은 에러: 에러 리포팅 연동 지점
  console.error(err.message, request.path);
}
```

| 훅 | 시점 | 쓰임새 |
| --- | --- | --- |
| `register()` | 서버 시작 시 1회 | 커넥션 풀, tracing SDK 초기화 |
| `onRequestError()` | 요청 중 잡히지 않은 에러 | Sentry 등 에러 리포팅 |

## OpenTelemetry 연동

Next.js는 OTel을 자동 감지해 렌더링·fetch 등의 span을 만듭니다.
`register()`에서 SDK를 초기화하면 APM에서 내부 동작까지 관찰됩니다:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-otel");  // SDK 초기화 모듈
  }
}
```

`NEXT_RUNTIME`으로 Node.js/Edge 런타임을 구분해 초기화 코드를 분리합니다.

## 정량 비교: 에러 감지 시점

| 방식 | 발견 시점 |
| --- | --- |
| 사용자 제보 | 운영 영향 후 |
| 로그 모니터링 | 로그 수집 주기만큼 지연 |
| `onRequestError` + APM | **발생 즉시** (경로·메서드·digest 포함) |

## 좋은 활용 사례

- 에러 리포팅(Sentry 등)은 `onRequestError` 한 곳에서
- `digest`로 클라이언트 오류 화면과 서버 로그 매칭
- 무거운 초기화는 `register()`에서 한 번만 (요청마다 하지 않음)

## DX 개선

- 프레임워크 라이프사이클 훅이라 웹훅/별도 서버 없이 초기화
- 에러 컨텍스트(경로, 메서드, 헤더)가 자동으로 함께 전달

## 관련 문서

- [Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- [OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry)
