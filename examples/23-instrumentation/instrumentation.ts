// instrumentation.ts: 서버 시작 시 한 번 실행되는 초기화 훅입니다.
// app/ 폴더 밖(프로젝트 루트)에 둡니다.

// 서버가 시작될 때 한 번 호출됩니다.
// DB 커넥션 풀 준비, OpenTelemetry SDK 등록 등에 사용합니다.
export async function register() {
  console.log(
    `[instrumentation] register() 실행됨 — 런타임: ${process.env.NEXT_RUNTIME ?? "nodejs"}`,
  );

  // OpenTelemetry를 쓴다면 여기서 초기화합니다.
  // if (process.env.NEXT_RUNTIME === "nodejs") {
  //   await import("./instrumentation-otel");
  // }
}

// 요청 처리 중 던져진(잡히지 않은) 에러를 가로챕니다.
// 에러 리포팅 서비스(Sentry 등) 연동 지점입니다.
export function onRequestError(
  err: Error & { digest?: string },
  request: {
    path: string;
    method: string;
    headers: Headers;
  },
) {
  console.error(
    `[instrumentation] 요청 에러: ${request.method} ${request.path} — ${err.message} (digest: ${err.digest ?? "없음"})`,
  );
}
