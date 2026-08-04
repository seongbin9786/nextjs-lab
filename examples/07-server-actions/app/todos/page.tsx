import Link from "next/link";
import { listTodos } from "@/lib/db";
import { TodoForm } from "@/components/todo-form";

// 모듈 상태를 읽으므로 매 요청 새로 렌더링해야 최신 목록이 보입니다.
export const dynamic = "force-dynamic";

export default function TodosPage() {
  const todos = listTodos();

  return (
    <div className="container">
      <h1>할 일 추가 폼</h1>
      <p>
        폼을 제출하면 <code>createTodo</code> Server Action이 호출되고,
        완료되면 이 페이지가 <strong>다시 렌더링</strong>되어 새 목록이
        보입니다. 새로고침 코드가 한 줄도 없습니다.
      </p>
      <TodoForm />
      <h2>목록 ({todos.length})</h2>
      <div className="card">
        <ul style={{ margin: 0 }}>
          {todos.map((todo) => (
            <li key={todo.id}>
              {todo.text}{" "}
              <span className="muted metric">({todo.createdAt})</span>
            </li>
          ))}
        </ul>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
