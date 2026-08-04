# 08 — Route Handlers

> `app/**/route.ts`로 만드는 HTTP 엔드포인트. 웹 표준 Request/Response를 그대로 사용합니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000 (홈에서 playground로 직접 호출 가능)
```

## 이 예시의 엔드포인트

| 경로 | 메서드 | 데모 |
| --- | --- | --- |
| `/api/items` | GET, POST | 쿼리 파라미터, JSON 본문 파싱, 상태 코드 |
| `/api/items/[id]` | GET, DELETE | 동적 세그먼트 + `await params` |
| `/api/stream` | GET | `ReadableStream` 스트리밍 (SSE) |
| `/api/cors` | GET, OPTIONS | CORS 헤더 + 프리플라이트 |
| `/api/webhook` | POST | HMAC 서명 검증 |

## 핵심 개념

```ts
// HTTP 메서드 이름을 그대로 export
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  return NextResponse.json({ items }, { status: 200 });
}
```

### 스트리밍 (SSE)

```ts
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(encoder.encode("data: {...}\n\n"));
  },
});
return new Response(stream, {
  headers: { "Content-Type": "text/event-stream; charset=utf-8" },
});
```

### 웹훅 서명 검증

```ts
const expected = createHmac("sha256", SECRET).update(raw).digest("hex");
// 타이밍 공격 방지: 상수 시간 비교
timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
```

## 정량 비교: Route Handler vs Express

| 항목 | Next.js Route Handler | 별도 Express 서버 |
| --- | --- | --- |
| 배포 단위 | 앱 1개 | 앱 + API 서버 2개 |
| CORS 구성 | 필요 없음 (같은 origin) | 필수 |
| 인증 공유 | 쿠키/세션 동일 프로세스 | 별도 동기화 |
| 추가 인프라 | 0 | 로드밸런서/도메인 추가 |

`/`의 playground에서 버튼으로 각 API를 호출하고 응답을 볼 수 있습니다.

## 좋은 활용 사례

- 웹훅 수신 (외부 → 우리 서버): 서명 검증 필수
- SSE/스트리밍 응답
- 다른 클라이언트(모바일 앱 등)도 쓰는 API
- 앱 내부 폼 제출은 Route Handler 대신 **Server Action**(07예시) 권장

## DX 개선

- Pages Router의 `req/res` + 수동 라우팅 분기(`if (req.method === ...)`)가 사라짐
- 웹 표준 `Response` API라 Edge/다른 런타임으로 이식 가능
- 동적 세그먼트(`[id]`)를 API 경로에도 동일하게 사용

## 관련 문서

- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
