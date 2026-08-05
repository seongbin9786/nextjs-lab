# 07 — Server Actions와 폼

> `"use server"` 함수로 API 라우트 없이 폼 제출·데이터 변경을 처리합니다.

Server Action은 `"use server"` 지시어로 표시하는 서버 함수입니다. 폼의
`action` 속성에 넣거나 이벤트 핸들러에서 직접 호출해서, 별도의 엔드포인트
코드 없이 서버 로직을 실행합니다. 이 문서는 지시어가 빌드 때 하는 일부터,
폼 제출 요청이 실제로 어떻게 날아가고, 응답이 어떻게 화면에 반영되는지까지
동작 원리를 순서대로 따라갑니다.

## 실행

```bash
pnpm install
pnpm dev   # http://localhost:3000
```

## 이 예시가 보여주는 것

| 페이지 | 내용 |
| --- | --- |
| `/todos` | 폼 + `useActionState`(결과) + `useFormStatus`(제출 중) |
| `/photos` | `useOptimistic` 낙관적 업데이트 (좋아요) |
| `/manual` | 폼 없이 `useTransition`으로 액션 호출 |

세 페이지 모두 `lib/db.ts`의 메모리 내 상태를 저장소로 사용합니다.
데모용이라 서버를 재시작하면 데이터가 초기화됩니다.

## 동작 원리

Server Action은 마법처럼 보이지만, 요청과 응답의 흐름을 하나씩 뜯어보면
꽤 기계적인 구조입니다. 빌드 시점부터 응답이 화면에 반영되기까지를 다섯
단계로 나눕니다.

### 1단계 — `"use server"`: 컴파일 타임에 함수가 엔드포인트로 등록됩니다

`app/actions.ts`는 파일 맨 위의 `"use server"` 한 줄로 시작합니다. 이
지시어가 있으면 파일의 모든 export가 각각 독립적인 Server Action이
됩니다. 빌드 때 컴파일러는 다음 작업을 합니다.

- 각 액션에 고유한 **액션 ID**를 부여하고 서버 쪽 매니페스트에
  등록합니다. 함수 구현은 서버에만 남습니다.
- 클라이언트 번들에서는 함수 구현을 빼고, 그 자리를 **참조**(액션 ID +
  서버로 POST를 보내는 dispatcher)로 교체합니다. 공식 문서의 표현대로
  "클라이언트 번들 안의 함수 구현을, 서버로 POST를 보내는 참조로
  교체(swap)"하는 것입니다.
- 사용되지 않는 서버 함수는 클라이언트 번들에서 아예 제거되고(dead code
  elimination), 액션 참조는 빌드 때 암호화됩니다.

그래서 클라이언트 번들 속 `createTodo`는 함수 본문이 아니라 "이 ID로
POST를 보내라"는 참조입니다. 브라우저에서 `createTodo()`를 호출하면 함수
본문이 아니라 네트워크 요청이 실행됩니다.

이때 Server Action은 **해당 액션을 호출한 페이지로 가는 POST 요청**으로
실행됩니다. 이 예시에서는 `/todos` 페이지가 호출하므로 POST 대상도
`/todos`입니다. 즉 모든 액션은 POST를 보낼 수 있는 누구에게나 열려 있는
진입점입니다. 보안 이야기는 아래 "흔한 오해와 주의점"에서 이어집니다.

### 2단계 — JavaScript가 없어도 됩니다: 네이티브 폼 제출

React는 HTML `<form>` 요소를 확장해서 `action` 속성에 함수를 받습니다.
서버가 렌더링한 HTML에는 폼과 함께, 어느 액션인지를 식별하는 숨은
필드(`$ACTION_ID_`로 시작하는 키)가 실립니다.

JavaScript가 로드되기 전(또는 꺼진 환경)에 사용자가 제출 버튼을 누르면,
브라우저는 HTML 폼의 원래 동작대로 **네이티브 POST 제출**을 합니다. 이때
Next.js는 FormData 속 `$ACTION_ID_` 필드를 보고 해당하는 액션을 찾아
실행한 뒤, **완전히 렌더링된 HTML 페이지**를 응답으로 돌려줍니다. 즉 JS
없이도 "제출 → 서버 실행 → 결과 반영"이 동작합니다. 이것이 점진적
향상(progressive enhancement)입니다.

`useActionState`의 세 번째 인수 `permalink`를 지정하면, JS 로딩 전에
제출됐을 때 어느 URL로 이동할지 명시할 수 있습니다. 참고로 `bind`로
인수를 묶어 넘기는 방식도 점진적 향상을 지원합니다.

### 3단계 — JavaScript가 있으면: React이 제출을 가로채서 fetch로 보냅니다

JS가 로드된 뒤에는 React이 폼의 submit 이벤트를 가로채서, 액션을
`fetch` POST로 보냅니다. 실제로 날아가는 요청의 모습은 다음과 같습니다.

- **URL**: 현재 페이지 URL (이 예시에서는 `/todos`)
- **메서드**: `POST`
- **헤더**: `next-action: <액션 ID>`, `next-router-state-tree`(현재 라우터
  상태), `Accept: text/x-component`
- **본문**: 폼 필드값과 묶인(bound) 인수를 직렬화한 FormData. 입력값의
  키는 input의 `name` 속성 그대로입니다 (이 예시에서는 `text`)

서버는 `next-action` 헤더의 ID로 액션 모듈을 찾아내고, 본문을 디코딩해
인수를 복원한 뒤 함수를 실행합니다. 폼 액션의 경우 `FormData`가 마지막
인수로 들어가므로 `createTodo`의 시그니처가
`(_prev: TodoActionResult, formData: FormData)`가 되는 것입니다. 첫
인수 `_prev`는 `useActionState`가 자동으로 채워주는 "이전 상태"입니다.

액션 요청의 본문 크기는 기본 1MB로 제한되며, `next.config`의
`serverActions.bodySizeLimit`으로 조정할 수 있습니다. 액션 응답에는
`Cache-Control: no-cache, no-store` 헤더가 붙어 중간에서 캐시되지
않습니다.

### 4단계 — 응답: Next.js 16의 단일 왕복(single round-trip) 모델

응답은 JSON이 아닙니다. 액션의 반환값과 (조건부로) 새로 렌더링한 화면이
**하나의 RSC Flight 스트림**(`text/x-component`)에 담겨 옵니다.

Next.js 16에서 핵심은 "응답에 현재 라우트의 재렌더링이 포함되는가"가
**액션이 즉시 재검증을 일으켰는지**에 달렸다는 점입니다. 공식 문서에
따르면, 액션이 다음 중 하나를 하면 서버가 액션 실행 직후 현재 라우트를
서버에서 다시 렌더링해서 같은 응답에 싣습니다.

- `revalidatePath` 또는 `updateTag` 호출 — 캐시 무효화
- `refresh()` 호출 — 현재 라우트의 RSC 페이로드 다시 가져오기
- `cookies()`로 쿠키 설정/삭제 — 쿠키가 바뀌면 화면도 바뀌어야 하므로
  자동으로 재렌더링
- `redirect()` 호출 — 응답이 라우터를 목적지로 이동시키고, 목적지의 RSC
  페이로드까지 스트리밍

이 경우 흐름은 "액션 실행 → 재렌더링 → 반환값 + 새 페이로드를 한 응답에
전달 → 클라이언트가 이를 그대로 커밋(seeded navigation)"이 되어, 화면
갱신까지 **한 번의 왕복**으로 끝납니다. 예전처럼 "액션 응답 수신 → 별도
refetch 요청" 두 단계가 아닙니다.

반대로 위 중 아무것도 하지 않은 액션의 응답은 **반환값만** 담고, 현재
라우트는 재렌더링되지 않습니다. 이 경우에도 `useActionState`의 `state`는
정상적으로 갱신됩니다(반환값은 항상 전달되므로).

이 예시의 `createTodo`는 저장 직후 `revalidatePath("/todos")`를 호출해서
새 목록이 같은 왕복 안에서 화면에 반영되게 합니다. 재검증 호출이 없으면
결과 메시지만 보이고 목록은 갱신되지 않는데, 이 차이는 "흔한 오해와
주의점"의 첫 항목에서 다시 설명합니다. 태그 기반 무효화가 필요한 경우는
06 예시의 `updateTag`를 참고하세요.

`redirect()`는 안에서 제어 흐름 예외를 던지는 방식으로 동작합니다. 그래서
`redirect()` 뒤의 코드는 실행되지 않으며, 목적지에 최신 데이터가
필요하다면 재검증 호출을 `redirect()` **앞에** 두어야 합니다.

`/todos`에서 폼을 제출했을 때 전체 흐름을 요약하면 이렇습니다.

1. 사용자가 "추가" 클릭 → React이 submit 이벤트를 가로챔
2. `POST /todos` — 헤더에 `next-action: <액션 ID>`, 본문은 FormData
3. 서버에서 `createTodo` 실행 (검증 → 800ms 대기 → 저장)
4. 서버가 응답 생성 — 액션 반환값 (+ 재검증이 일어났다면 새로 렌더링한
   RSC 페이로드)
5. 클라이언트에서 `useActionState` 상태 갱신, 페이로드가 있다면 그
   페이로드로 화면 갱신

### 5단계 — 훅 3종은 응답 흐름의 어느 시점에 개입할까요

시점별로 정리하면 다음 표와 같습니다.

| 시점 | 일어나는 일 |
| --- | --- |
| 제출 시작 | `useActionState`의 `isPending`, `useFormStatus`의 `pending`이 `true`로. `useOptimistic`은 `startTransition` 안에서 `addOptimistic`을 호출하는 즉시 낙관적 값을 렌더링 |
| 서버 실행 중 | 요청이 왕복하는 동안 pending 상태 유지. 여러 액션을 연달아 트리거하면 클라이언트가 **하나씩 순서대로** 처리(순차 dispatch) |
| 응답 도착 | 액션 반환값이 `useActionState`의 `state`로 반영되며 재렌더링. `isPending`/`pending`은 `false`로 |
| 트랜지션 종료 | `useOptimistic`의 임시 값이 실제 값으로 수렴. 액션이 에러를 던졌다면(실제 값이 갱신되지 않았다면) 원래 값으로 자동 복귀 |

훅별 보충 설명입니다.

- `useFormStatus`는 `pending` 외에도 제출 중인 `data`(FormData),
  `method`, `action` 참조를 돌려줍니다(React 19 기준). 단 **부모
  `<form>`**의 상태만 보므로, 폼을 렌더링하는 컴포넌트 자신이 아니라 폼
  **안의 자식 컴포넌트**에서 호출해야 합니다. 이 예시가 `SubmitButton`을
  따로 분리한 이유입니다.
- `useActionState`의 액션은 `dispatchAction`이 호출될 때마다 실행되며,
  여러 번 호출되면 큐에 쌓여 순서대로 실행됩니다. 각 호출은 이전 호출의
  결과를 `previousState`로 받습니다.
- Next.js는 클라이언트에서 Server Action을 한 번에 하나씩만 보냅니다.
  세 개를 연달아 트리거하면 1번 완료 → 2번 → 3번 순으로 기다립니다.
  액션 결과로 재렌더링된 화면이 그 액션과 어긋나지 않게 하려는
  설계입니다. 그래서 클라이언트 쪽에서 `Promise.all`로 액션을 병렬화하는
  것에 의존하면 안 됩니다. 병렬 작업이 필요하면 하나의 액션 안에서
  처리하세요.

## 코드와 함께 보는 설명

### `app/actions.ts` — 서버 액션 정의

```ts
"use server";
```

이 한 줄로 파일 전체가 서버 액션 파일이 됩니다. 실제 `createTodo`
구현입니다.

```ts
// app/actions.ts (전체 22줄 중 핵심)
export async function createTodo(
  _prev: TodoActionResult,
  formData: FormData,
): Promise<TodoActionResult> {
  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { ok: false, message: "내용을 입력해주세요." };
  }
  if (text.length > 50) {
    return { ok: false, message: "50자를 넘길 수 없습니다." };
  }
  await wait(800);
  addTodo(text);
  revalidatePath("/todos");
  return { ok: true, message: "추가했습니다." };
}
```

눈여겨볼 점:

- **검증은 서버에서 합니다.** 클라이언트 검증은 편의일 뿐, 진짜 검증은
  여기처럼 서버 쪽에 있어야 합니다. FormData는 신뢰할 수 없는 입력입니다.
- **800ms 대기**는 네트워크/DB 지연 흉내입니다. 제출 중 상태가 UI에
  반영되는 모습을 눈으로 확인할 수 있게 일부러 넣었습니다.
- **`revalidatePath`가 목록 갱신의 방아쇠입니다.** 이 호출 덕분에 서버가
  현재 라우트를 다시 렌더링해서 새 목록이 같은 응답에 실려 옵니다.
- **반환값이 곧 상태입니다.** 에러를 던지는 대신 `{ ok, message }`를
  돌려주면 `useActionState`의 `state`로 그대로 전달됩니다.
- `likePhoto`는 `FormData` 없이 일반 인수·반환값만으로 동작하는
  액션입니다. 폼 없이 호출하는 액션은 이렇게 평범한 함수처럼 쓸 수
  있습니다.

### `components/todo-form.tsx` — `useActionState` + `useFormStatus`

```tsx
const [state, formAction, isPending] = useActionState(createTodo, initial);
// useFormStatus는 폼 '안의' 자식 컴포넌트에서 호출해야 함
<form action={formAction}>...</form>
```

- `useActionState(action, initialState)`는 `[state, formAction,
  isPending]`을 돌려줍니다. `formAction`을 `<form action>`에 넣으면 제출
  시 액션이 실행되고, 액션의 반환값이 `state`에 담깁니다.
- 실제 코드는 `isPending` 대신 `useFormStatus`로 제출 중 상태를
  처리합니다. 제출 버튼이 폼 안의 자식 컴포넌트여야 하기 때문입니다.

```tsx
// components/todo-form.tsx
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "추가하는 중…" : "추가"}
    </button>
  );
}
```

결과 메시지는 `state.message`를 조건부로 그립니다. 서버 검증에 걸리면
`state.ok`가 `false`인 채로 메시지가 와서 빨간색으로 표시됩니다.

### `components/like-button.tsx` — `useOptimistic`

```tsx
const [optimistic, addOptimistic] = useOptimistic(likes, (s, d) => s + d);
startTransition(async () => {
  addOptimistic(1);      // 즉시 +1 표시
  await likePhoto();     // 서버 액션 (느려도 체감 지연 없음)
});
```

`useOptimistic(initial, reducer)`는 트랜지션이 진행 중인 동안만 임시 값을
보여줍니다. `addOptimistic(1)`을 호출하는 **즉시** 화면의 숫자가 오르고,
약 0.6초 뒤 `likePhoto()`가 완료되어 트랜지션이 끝나면 실제 값으로
수렴합니다. 실패해서 실제 값이 갱신되지 않았다면 임시 값이 자동으로
사라지므로 롤백 코드를 직접 짤 필요가 없습니다.

```tsx
// components/like-button.tsx
function onClick() {
  startTransition(async () => {
    addOptimistic(1);      // 즉시 +1 표시
    await likePhoto();     // 서버 액션 실행 (600ms)
  });
}
```

### `components/manual-buttons.tsx` — 폼 없이 호출

```tsx
// components/manual-buttons.tsx
function onLike() {
  startTransition(async () => {
    const next = await likePhoto();
    setResult(next);
  });
}
```

폼이 없으면 `startTransition` 안에서 일반 함수처럼 `await`하면 됩니다.
입력값은 FormData가 아니라 일반 인수로 넘기고, 반환값도 그대로 받습니다.
`isPending`으로 호출 중 상태를 표시할 수 있습니다.

### `app/todos/page.tsx` — 목록을 그리는 서버 컴포넌트

```tsx
// app/todos/page.tsx
export const dynamic = "force-dynamic";

export default function TodosPage() {
  const todos = listTodos();
```

페이지는 매 요청 새로 렌더링되도록 `force-dynamic`로 두고, 서버
컴포넌트에서 `listTodos()`를 직접 읽어 목록을 그립니다. 폼 제출 후 이
페이지의 RSC 페이로드가 다시 생성되는 경우(4단계의 재검증 조건을
만족할 때) 새 목록이 같은 응답에 실려 옵니다.

## 정량 비교: API 라우트 방식 vs Server Action

| 항목 | API 라우트 | Server Action |
| --- | --- | --- |
| 작성 파일 | `route.ts` + 클라이언트 fetch 코드 | 함수 1개 |
| 폼 직렬화 | 수동 (`JSON.stringify`/파싱) | FormData 자동 |
| JS 비활성 환경 | 제출 불가 | **네이티브 폼 제출로 동작** |
| 제출 후 갱신 | 수동 refetch | **자동 re-render** |
| 왕복 (Next 16) | 요청 → 응답 → refetch 요청 | **단일 왕복** (액션 + 갱신이 한 응답) |

`/todos`에서 800ms 지연을 넣었지만 "추가하는 중…" 상태와 결과 표시가
추가 코드 없이 처리됩니다.

표의 "자동 re-render"는 프레임워크가 왕복을 대신 처리해 준다는 의미입니다.
다만 Next.js 16에서는 재렌더링이 응답에 실리는 조건이 있습니다. 액션이
`revalidatePath`, `updateTag`, `refresh()`, 쿠키 변경, `redirect()` 중
하나라도 일으켜야 같은 응답에 새 화면이 포함됩니다(동작 원리 4단계). 이
예시의 `createTodo`는 `revalidatePath("/todos")`를 호출해서 목록 갱신이
같은 왕복 안에서 일어나게 만듭니다.

### 정량 비교: 같은 기능을 만드는 데 필요한 코드 (실측 라인 수)

이 예시의 `createTodo` 기능 구현에 실제로 들어간 코드:

| 파일 | 라인 수 | 역할 |
| --- | --- | --- |
| `app/actions.ts` (createTodo 부분) | 약 25 | 검증 + 저장 + 결과 반환 |
| `components/todo-form.tsx` | 47 | 폼 + 제출 중/결과 상태 UI |

같은 것을 API 라우트 방식으로 만들면 최소한:

| 필요한 것 | 라인 수 (추정) |
| --- | --- |
| `app/api/todos/route.ts` (POST 파싱/검증/저장/응답) | 약 30 |
| 클라이언트 fetch 래퍼 (에러 처리 포함) | 약 15 |
| 폼 쪽 pending/에러/새로고침 수동 상태 관리 | 약 20 |

엔드포인트·직렬화·상태 관리가 사라져 **코드가 줄고, 사라진 코드만큼
버그가 날 면적도 줍니다**.

## 좋은 활용 사례

- 생성/수정/삭제 폼은 Server Action (읽기 전용 API만 Route Handler로)
- 서버 검증은 필수 — 클라이언트 검증은 편의용일 뿐
- 좋아요/즐겨찾기는 `useOptimistic`으로 체감 지연 제거
- 실패 시나리오는 `useActionState`의 반환 값으로 전달
- 변형 후 다른 화면으로 이동은 액션 안에서 `redirect()`로 (재검증이
  필요하면 `redirect()` 앞에 호출)
- 추가 인수는 `bind`로 묶거나 숨은 input으로 전달 — `bind`도 점진적
  향상을 지원합니다

## 흔한 오해와 주의점

1. **"폼을 제출하면 항상 화면이 자동으로 갱신된다"** — Next.js 16에서는
   액션이 재검증(`revalidatePath`, `updateTag`, `refresh()` 등)을
   일으킨 경우에만 재렌더링이 같은 응답에 포함됩니다. 아무 재검증도 없는
   액션의 응답은 반환값만 전달하고 현재 라우트는 재렌더링되지 않습니다.
   이 예시의 `createTodo`에 `revalidatePath("/todos")`가 들어 있는 이유가
   이것입니다. 이 줄을 지우고 제출해 보면 결과 메시지는 나와도 목록이
   갱신되지 않는 것을 직접 확인할 수 있습니다.
2. **"클라이언트에서 검증했으니 서버 검증은 선택이다"** — 액션은 POST를
   보낼 수 있는 누구에게나 열려 있습니다. FormData·쿼리·헤더를 전부
   신뢰할 수 없는 입력으로 다루고, 인증·인가 검사도 액션 **안에서**
   해야 합니다. 인증된 페이지에만 폼을 그리는 것은 보안 경계가 아닙니다.
3. **"useFormStatus는 폼을 만든 컴포넌트에서 쓰면 된다"** — 이 훅은
   **부모** `<form>`의 상태만 봅니다. 폼을 렌더링하는 컴포넌트 자신이
   호출하면 `pending`이 항상 `false`입니다. 반드시 폼 안의 자식
   컴포넌트(이 예시의 `SubmitButton`)로 분리해야 합니다.
4. **"Server Action은 숨겨진 함수라 안전하다"** — 프레임워크가 CSRF
   검사(`Origin`과 `Host` 비교)와 본문 크기 제한(기본 1MB), 액션 ID
   암호화를 제공하지만, 그것은 프레임워크 차원의 방어일 뿐입니다.
   렌더링 때 폼을 안 보여주는 것과는 별개로, 모든 액션을 검증이 필요한
   공개 진입점으로 취급하세요.
5. **"액션 ID는 영원히 같다"** — 액션 ID는 빌드 산출물이라 새 배포마다
   보통 바뀌고, 코드가 그대로여도 늦어도 14일마다 순환됩니다. 이전
   빌드를 실행 중인 탭에서 새 배포의 서버로 액션을 호출하면 "Failed to
   find Server Action" 오류가 날 수 있으니, 롤링 배포와 재시도 경로
   제공으로 영향을 줄입니다.

## DX 개선

- "엔드포인트 작성 → fetch 함수 작성 → 에러 처리" 3단계가 함수 1개로 축소
- 점진적 향상: JS 로딩 전에도 폼이 동작
- Next 16 단일 왕복 모델로 제출 후 화면 갱신까지 한 번의 응답으로 처리

## 관련 문서

- [Server Actions](https://nextjs.org/docs/app/guides/server-actions)
- [Forms](https://nextjs.org/docs/app/guides/forms)
- [use server 지시어](https://nextjs.org/docs/app/api-reference/directives/use-server)
- [useActionState](https://react.dev/reference/react/useActionState)
- [useFormStatus](https://react.dev/reference/react-dom/hooks/useFormStatus)
- [useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Data Security](https://nextjs.org/docs/app/guides/data-security)
- [How revalidation works](https://nextjs.org/docs/app/guides/how-revalidation-works)
