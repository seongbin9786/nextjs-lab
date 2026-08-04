"use client";

// 서버 컴포넌트 → 클라이언트 컴포넌트로 넘어가는 props는
// 직렬화 가능한 값만 허용됩니다.
export function PropsDisplay({
  text,
  number,
  date,
  list,
  nested,
}: {
  text: string;
  number: number;
  date: Date;
  list: string[];
  nested: { ok: boolean };
}) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>
        서버에서 props로 받은 값 <span className="badge client">클라이언트</span>
      </h3>
      <table>
        <tbody>
          <tr>
            <td>문자열</td>
            <td className="metric">{text}</td>
          </tr>
          <tr>
            <td>숫자</td>
            <td className="metric">{number}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td className="metric">{date.toLocaleString("ko-KR")}</td>
          </tr>
          <tr>
            <td>배열</td>
            <td className="metric">{list.join(", ")}</td>
          </tr>
          <tr>
            <td>중첩 객체</td>
            <td className="metric">{JSON.stringify(nested)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
