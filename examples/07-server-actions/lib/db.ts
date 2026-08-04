// 서버 프로세스 메모리에 사는 저장소 흉내입니다.
// 데모용이므로 서버를 재시작하면 초기화됩니다.
export type Todo = {
  id: number;
  text: string;
  createdAt: string;
};

const state = {
  todos: [
    { id: 1, text: "Server Actions 문서 읽기", createdAt: "10:00:00" },
    { id: 2, text: "폼 하나 만들어보기", createdAt: "10:05:00" },
  ] as Todo[],
  nextId: 3,
  likes: 7,
};

export function listTodos(): Todo[] {
  return state.todos;
}

export function addTodo(text: string): Todo {
  const todo: Todo = {
    id: state.nextId,
    text,
    createdAt: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
  };
  state.nextId += 1;
  state.todos = [...state.todos, todo];
  return todo;
}

export function getLikes(): number {
  return state.likes;
}

export function addLike(): number {
  state.likes += 1;
  return state.likes;
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
