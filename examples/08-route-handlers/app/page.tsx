import { Playground } from "@/components/playground";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Route Handlers</h1>
      <p>
        Route Handler는 <code>app/</code> 아래 <code>route.ts</code> 파일로
        만드는 HTTP 엔드포인트입니다. 웹 표준 <code>Request</code>/<code>Response</code>를
        그대로 사용합니다.
      </p>

      <Playground />

      <h2>이 예시의 엔드포인트</h2>
      <table>
        <thead>
          <tr>
            <th>경로</th>
            <th>메서드</th>
            <th>보여주는 것</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="metric">/api/items</td>
            <td>GET, POST</td>
            <td>쿼리 파라미터, JSON 본문 파싱, 상태 코드</td>
          </tr>
          <tr>
            <td className="metric">/api/items/[id]</td>
            <td>GET, DELETE</td>
            <td>동적 세그먼트, async params</td>
          </tr>
          <tr>
            <td className="metric">/api/stream</td>
            <td>GET</td>
            <td>ReadableStream 스트리밍 (SSE)</td>
          </tr>
          <tr>
            <td className="metric">/api/cors</td>
            <td>GET, OPTIONS</td>
            <td>CORS 헤더, 프리플라이트</td>
          </tr>
          <tr>
            <td className="metric">/api/webhook</td>
            <td>POST</td>
            <td>HMAC 서명 검증</td>
          </tr>
        </tbody>
      </table>

      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>Route Handler vs Server Action</strong> — 읽기/웹훅/스트리밍/외부
          클라이언트 대상 API는 Route Handler, 앱 안의 폼 제출·변경은 Server
          Action이 일반적입니다.
        </p>
      </div>
    </div>
  );
}
