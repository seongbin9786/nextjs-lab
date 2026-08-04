"use client";

import { useEffect, useRef, useState } from "react";

export function Playground() {
  const [output, setOutput] = useState<string[]>([]);
  const [sseRunning, setSseRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  function log(line: string) {
    setOutput((prev) => [...prev.slice(-30), line]);
  }

  useEffect(() => {
    return () => eventSourceRef.current?.close();
  }, []);

  async function call(method: string, url: string, body?: unknown) {
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      log(`[${method} ${url}] ${res.status} → ${text}`);
    } catch (e) {
      log(`[${method} ${url}] 오류: ${String(e)}`);
    }
  }

  function startSse() {
    if (eventSourceRef.current) return;
    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;
    setSseRunning(true);
    let received = 0;
    es.onmessage = (e) => {
      received += 1;
      log(`[SSE] ${e.data}`);
    };
    // 서버가 10개 이벤트를 끝으로 스트림을 닫습니다.
    // EventSource는 기본적으로 재시도하므로, 에러(=서버 종료) 시점에
    // 직접 close()해서 마무리합니다.
    es.onerror = () => {
      log(`[SSE] 종료 (총 ${received}개 이벤트 수신)`);
      es.close();
      eventSourceRef.current = null;
      setSseRunning(false);
    };
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>직접 호출해보기</h3>
      <p style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => call("GET", "/api/items")}>GET items</button>
        <button
          onClick={() =>
            call("POST", "/api/items", { name: `항목 ${Date.now() % 1000}` })
          }
        >
          POST item
        </button>
        <button onClick={() => call("GET", "/api/items?q=키")}>GET ?q=키</button>
        <button onClick={() => call("GET", "/api/items/999")}>
          GET 404
        </button>
        <button onClick={() => call("GET", "/api/cors")}>GET CORS</button>
        <button onClick={startSse} disabled={sseRunning}>
          {sseRunning ? "SSE 수신 중…" : "SSE 시작"}
        </button>
        <button
          className="secondary"
          onClick={() => setOutput([])}
        >
          로그 지우기
        </button>
      </p>
      <pre style={{ minHeight: 120, maxHeight: 260, overflow: "auto" }}>
        <code>{output.length ? output.join("\n") : "여기에 결과가 표시됩니다."}</code>
      </pre>
    </div>
  );
}
