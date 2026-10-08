# 08 — Route Handlers

> `app/**/route.ts`로 만드는 HTTP 엔드포인트. 웹 표준 Request/Response를 그대로 사용합니다.

Route Handler는 `app/` 디렉터리 아래 `route.ts` 파일로 만드는 HTTP
엔드포인트입니다. 프레임워크 전용 객체 대신 웹 표준 `Request`와
`Response`를 그대로 쓰기 때문에, 브라우저든 서버든 같은 API를 다뤄본
경험이 그대로 옮겨집니다. 이 문서에서는 메서드별 export 방식부터 SSE
스트리밍, CORS, 웹훅 서명 검증까지 원리를 하나씩 뜯어봅니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000 (홈에서 playground로 직접 호출 가능)
```

## 이 예시가 보여주는 것

| 경로 | 메서드 | 데모 |
| --- | --- | --- |
| `/api/items` | GET, POST | 쿼리 파라미터, JSON 본문 파싱, 상태 코드 |
| `/api/items/[id]` | GET, DELETE | 동적 세그먼트 + `await params` |
| `/api/stream` | GET | `ReadableStream` 스트리밍 (SSE) |
| `/api/cors` | GET, OPTIONS | CORS 헤더 + 프리플라이트 |
| `/api/webhook` | POST | HMAC 서명 검증 |

홈(`/`)의 playground에서 버튼으로 각 API를 직접 호출하고 응답을 볼 수
있습니다. 데이터는 `lib/store.ts`의 메모리 내 상태를 사용하므로 서버를
재시작하면 초기화됩니다.

## 동작 원리

### `route.ts`는 웹 표준 API를 그대로 씁니다

Route Handler의 인수는 웹 표준 `Request`이고, 반환값은 웹 표준
`Response`입니다. `Headers`, `URL`, `ReadableStream` 같은 나머지도 전부
표준 API입니다. Next.js는 그 위에 `NextRequest`/`NextResponse`라는 편의
확장을 제공합니다. `NextRequest`는 `cookies`와 파싱된 URL 객체
`nextUrl`을 바로 꺼낼 수 있게 해줍니다.

이것이 주는 이점은 이식성입니다. 핸들러 본문이 특정 프레임워크 객체에
묶여 있지 않아 Node.js 런타임과 Edge 런타임 사이를 옮길 수 있고,
Pages Router 시절의 `req`/`res`를 배우지 않아도 됩니다.

Route Handler는 라우팅의 **가장 낮은 수준**의 단위입니다.

- `layout`에 참여하지 않고, 클라이언트 내비게이션의 일부도 아닙니다.
- 같은 폴더에 `page.tsx`와 함께 있을 수 없습니다. 한 경로에서
  `route.ts`와 `page.tsx` 중 하나가 그 경로의 모든 HTTP 메서드를
  담당합니다.

### HTTP 메서드별로 export합니다

라우팅 설정 파일도, 메서드 분기 코드도 없습니다. 메서드 이름의 함수를
export하면 끝입니다.

```ts
// app/api/items/route.ts
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  let items = listItems();
  if (q) {
    items = items.filter((i) => i.name.includes(q));
  }
  return NextResponse.json({ items, count: items.length });
}
```

지원되는 메서드는 `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`,
`OPTIONS`입니다. export하지 않은 메서드로 요청이 들어오면 Next.js가
`405 Method Not Allowed`를 돌려줍니다. `OPTIONS`를 직접 export하지
않으면, 정의된 메서드 목록을 `Allow` 헤더에 실어 Next.js가 자동으로
응답합니다.

첫 인수 `request`는 생략할 수 있고, 두 번째 인수 `context`는 동적
세그먼트 값을 담은 `params`를 제공합니다. 둘 다 필요 없으면 인수가 없는
함수로도 충분합니다.

### 동적 세그먼트: `params`는 Promise입니다

폴더 이름의 `[id]`가 URL 파라미터가 됩니다.
`app/api/items/[id]/route.ts`는 `/api/items/3` 같은 요청을 받습니다.

```ts
// app/api/items/[id]/route.ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = getItem(Number(id));
  if (!item) {
    return NextResponse.json({ error: "없음" }, { status: 404 });
  }
  return NextResponse.json(item);
}
```

**Next.js 15부터 `params`는 Promise입니다.** `await params`로 풀어야
값을 얻을 수 있고, 그냥 쓰면 Promise 객체 자체가 넘어갑니다. 공식 문서의
예를 들면 `app/dashboard/[team]/route.ts`에서 `params`는
`Promise<{ team: string }>`이고, 캐치올 세그먼트
`app/blog/[...slug]/route.ts`에서는 `Promise<{ slug: string[] }>`처럼
배열이 됩니다. 타입스크립트에서는 전역 헬퍼
`RouteContext<'/api/items/[id]'>`로 `params` 타입을 자동 생성된 타입으로
잡을 수 있습니다(`next dev`/`next build`/`next typegen`으로 생성).

### 스트리밍과 SSE: `ReadableStream`으로 조금씩 보냅니다

일반 응답은 본문이 한 번에 완성되어야 하지만, `ReadableStream`을 본문으로
돌려주면 데이터를 준비되는 대로 나누어 보낼 수 있습니다. 이 예시는
Server-Sent Events(SSE) 형식으로 1초에 한 번씩 이벤트를 10개
보냅니다.

```ts
// app/api/stream/route.ts (핵심 부분)
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let tick = 0;
      timer = setInterval(() => {
        tick += 1;
        const event = `data: {"tick":${tick},"time":"..."}\n\n`;
        controller.enqueue(encoder.encode(event));
        if (tick >= 10) {
          clearInterval(timer);
          controller.close();
        }
      }, 1000);
    },
  });
```

SSE는 서버가 클라이언트로 단방향 이벤트를 밀어주는 표준입니다. 응답
헤더에 `Content-Type: text/event-stream`을 선언하고, 본문은 텍스트
형식을 따릅니다.

- 각 줄은 `필드: 값` 형태이고, `data:` 필드가 실제 내용입니다.
- **빈 줄(`\n\n`) 하나가 이벤트 하나의 끝**을 알립니다. 클라이언트는 이
  단위로 이벤트를 구분합니다.
- `:`로 시작하는 줄은 주석(keep-alive 용도로 흔히 사용), `id:`는 마지막
  이벤트 ID(재연결 시 이어서 받기), `event:`는 이름 있는 이벤트,
  `retry:`는 재연결 간격(밀리초)입니다.

클라이언트에서는 `EventSource`가 연결과 수신을 담당합니다.

```tsx
// components/playground.tsx (일부)
const es = new EventSource("/api/stream");
es.onmessage = (e) => { /* e.data는 data: 필드의 문자열 */ };
es.onerror = () => { es.close(); };
```

`EventSource`는 연결이 끊기면 **기본적으로 재연결을 시도**합니다. 이
예시처럼 서버가 10개 이벤트를 끝으로 스트림을 닫는 경우, 클라이언트가
재연결을 반복하지 않도록 `onerror` 시점에 직접 `close()`합니다.

응답 헤더의 `Cache-Control: no-store`와 파일의
`export const dynamic = "force-dynamic"`은 이 응답이 어디에서도
캐시되지 않게 합니다. 스트리밍 응답을 캐싱하면 "실시간"이 깨지기
때문입니다.

### CORS 헤더 수동 설정

브라우저의 동일 출처 정책 때문에, 한 출처에서 로드된 스크립트가 다른
출처의 API를 호출하면 브라우저가 응답 읽기를 막습니다. CORS는 이 상황에서
**서버가 헤더로 "이 출처는 허용한다"고 선언**하고, 브라우저가 그 규칙을
강제하는 구조입니다. 즉 요청 자체는 서버에 도착하고, 허용 여부는
응답 헤더가 결정합니다.

"비단순" 요청(JSON 본문 POST, 커스텀 헤더 등) 앞에는 브라우저가
**프리플라이트**로 `OPTIONS` 요청을 먼저 보내 허락을 구합니다. 서버가
`Access-Control-Allow-*` 헤더를 돌려주면, 그제야 브라우저가 진짜
요청을 보냅니다. 이 예시의 구성입니다.

```ts
// app/api/cors/route.ts
function corsHeaders(origin: string | null) {
  const allowed = origin === ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ? ALLOWED_ORIGIN : "",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
```

- 요청의 `Origin` 헤더를 읽어 허용 목록과 비교한 뒤, 허용할 때만
  `Access-Control-Allow-Origin`에 그 출처를 실어 보냅니다. 와일드카드
  (`*`)를 쓰지 않고 명시적으로 관리하는 것이 원칙입니다. 특히 인증
  정보(쿠키 등)가 함께 가는 요청에는 와일드카드를 쓸 수 없습니다.
- `Vary: Origin`은 "이 응답은 요청의 Origin에 따라 달라진다"는 뜻입니다.
  이 헤더가 있어야 캐시가 출처별로 응답을 따로 저장합니다.
- `OPTIONS`는 204로 프리플라이트에 답하고, **실제 응답(GET)에도 같은
  CORS 헤더를 붙여야** 브라우저가 JS에서 응답을 읽을 수 있습니다.
  프리플라이트만 통과시켜서는 부족합니다.

여러 Route Handler에 공통으로 CORS를 적용하려면 개별 파일 대신
proxy(구 middleware)나 `next.config`의 `headers` 설정을 쓰는 방법이
있습니다.

### 웹훅 서명 검증

웹훅은 방향이 반대입니다. 우리 앱이 남의 서버를 호출하는 게 아니라,
**외부 시스템이 우리 서버를 호출**합니다. 이때 호출자가 진짜 그
시스템인지 확인하는 표준적인 방법이 서명입니다. 발신자가 공유된 비밀
키로 본문에 HMAC 서명을 만들어 헤더에 싣고, 수신자는 같은 키로 서명을
다시 계산해 비교합니다. 이 예시의 순서는 이렇습니다.

```ts
// app/api/webhook/route.ts (핵심 부분)
const signature = request.headers.get("x-signature");
const raw = await request.text();

const expected = createHmac("sha256", SECRET).update(raw).digest("hex");

const valid =
  signature !== null &&
  signature.length === expected.length &&
  timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
```

1. `x-signature` 헤더에서 서명을 읽습니다.
2. 본문을 **파싱 전에 원문 텍스트 그대로** 읽습니다 (`request.text()`).
   서명은 "받은 그대로의 바이트"에 대한 것이므로, JSON으로 파싱했다가
   다시 직렬화하면 바이트가 달라져 검증이 깨질 수 있습니다.
3. `WEBHOOK_SECRET`으로 같은 알고리즘(HMAC-SHA256, hex 인코딩)의 서명을
   다시 계산합니다.
4. 두 서명을 비교합니다. 먼저 길이가 같은지 확인하고,
   `timingSafeEqual`로 **상수 시간 비교**를 합니다. 일반 문자열 비교는
   앞에서부터 몇 글자가 맞는지에 따라 소요 시간이 달라져, 응답 시간을
   관측하며 서명을 한 글자씩 맞춰가는 타이밍 공격의 여지가 있습니다.
5. 서명이 다르면 `401`로 거르고, 맞으면 그때 `JSON.parse(raw)`으로
   본문을 파싱해 실제 처리(캐시 무효화, 알림 등)를 합니다.

`timingSafeEqual`은 두 버퍼의 길이가 다르면 예외를 던지므로 길이 검사를
먼저 두는 것입니다.

## 코드와 함께 보는 설명

### `app/api/items/route.ts` — 쿼리 파라미터와 상태 코드

`GET`은 `request.nextUrl.searchParams`로 `q` 파라미터를 읽어 필터링합니다.
`POST`는 본문을 `request.json()`으로 파싱하는데, try/catch로 감싸 JSON이
아니면 `400`, `name`이 없거나 빈 문자열이면 `422`, 성공하면 생성된
항목과 함께 `201`을 돌려줍니다. 상태 코드의 의미를 응답마다 분명히
드러내는 것이 포인트입니다.

### `app/api/items/[id]/route.ts` — `await params`와 404

`GET`과 `DELETE` 모두 `const { id } = await params`로 세그먼트 값을
뽑아 `Number(id)`로 변환합니다. 없는 id면 `404`와 함께
`{ error: "없음" }`을 돌려줍니다. 동적 세그먼트의 값은 항상 문자열이므로
타입 변환이 필요합니다.

### `app/api/stream/route.ts` — 스트림 생명주기

`start(controller)`에서 `setInterval`로 1초마다
`data: {...}\n\n`를 `enqueue`하고, 10번째에 타이머를 정리한 뒤
`controller.close()`로 스트림을 닫습니다. `cancel()`에서도 타이머를 정리하는데,
클라이언트가 스트림 도중에 연결을 끊으면 이쪽이 호출됩니다. 정상 종료 때는
`cancel()`이 호출되지 않으므로 두 곳 모두에서 정리해야 합니다. 타이머를 정리하지 않으면
아무도 안 받는 이벤트를 계속 만들게 됩니다.

### `app/api/cors/route.ts` — 프리플라이트와 실제 응답

`OPTIONS`는 본문 없이 204 + CORS 헤더로 응답합니다. `GET`은 요청의
`Origin`을 응답 본문에 그대로 되돌려주어, playground에서 "내 요청에 어떤
헤더가 붙어 갔는지"를 눈으로 확인할 수 있게 했습니다. 허용 목록은
`ALLOWED_ORIGIN` 상수 하나(`https://example.com`)로 관리합니다.

### `app/api/webhook/route.ts` — 비밀 키 관리

비밀 키는 `process.env.WEBHOOK_SECRET`에서 읽고, 없으면 데모용
`"demo-secret"`으로 대체합니다. 실제 서비스에서는 환경 변수가 반드시
설정되어 있어야 합니다. Pages Router 시절과 달리 본문 파싱에 별도
설정(`bodyParser` 등)이 필요 없는 것도 차이점입니다.

### `components/playground.tsx` — 클라이언트 호출 쪽

버튼 하나로 `fetch` 호출을 만들어 상태 코드와 본문을 로그에 찍습니다.
SSE는 `EventSource`를 ref에 보관하고, 컴포넌트 언마운트 시
`close()`합니다. 서버가 스트림을 닫으면 `EventSource`는 재연결을
시도하므로, `onerror`에서 받은 이벤트 개수를 기록하고 직접
`close()`해 마무리합니다.

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

## 흔한 오해와 주의점

1. **"`page.tsx` 옆에 `route.ts`를 두면 둘 다 동작한다"** — 같은
   세그먼트에서는 둘 중 하나만 둘 수 있습니다. `route.ts`는 그 경로의
   모든 HTTP 메서드를 담당하는 가장 낮은 수준의 라우팅 단위입니다.
2. **"`params`는 그냥 객체다"** — Next.js 15부터 Promise입니다.
   `await params`를 빼먹으면 문자열 자리에 Promise가 들어가
   `"[object Promise]"` 같은 결과가 나옵니다.
3. **"CORS는 `Access-Control-Allow-Origin: *`로 열면 편하다"** — 인증
   정보(쿠키 등)가 함께 가는 요청에는 와일드카드를 쓸 수 없고, 허용
   출처는 명시적으로 관리해야 합니다. 그리고 CORS는 브라우저가 강제하는
   규칙일 뿐, 서버로 오는 요청 자체를 막지 못합니다. 브라우저 밖
   호출자(웹훅 발신자 등)에 대한 방어는 CORS가 아니라 서명 검증·인증의
   몫입니다.
4. **"`GET` Route Handler는 자동으로 캐시된다"** — Next.js 15부터
   기본은 캐시 없음(요청 시 실행)입니다. 캐시하려면
   `export const dynamic = 'force-static'` 같은 명시적 opt-in이
   필요하고, `GET`이 아닌 메서드는 같은 파일에 있어도 캐시되지
   않습니다. 스트리밍 응답은 `no-store`로 캐시를 확실히 끕니다.
5. **"폼 제출용 API도 route.ts로 만들자"** — 앱 안의 폼 제출·데이터
   변경은 Server Action(07 예시)이 더 적합합니다. Route Handler는
   웹훅·스트리밍·외부 클라이언트 대상 API처럼 "HTTP 그 자체"가 필요한
   자리에 쓰세요.

## DX 개선

- Pages Router의 `req/res` + 수동 라우팅 분기(`if (req.method === ...)`)가 사라짐
- 웹 표준 `Response` API라 Edge/다른 런타임으로 이식 가능
- 동적 세그먼트(`[id]`)를 API 경로에도 동일하게 사용

## 관련 문서

- [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Route Handlers (Getting Started)](https://nextjs.org/docs/app/getting-started/route-handlers)
- [route.js 파일 규칙 API 레퍼런스](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Server-Sent Events 사용하기 (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [EventSource (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
