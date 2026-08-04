export default function NestedPage() {
  const items = Array.from({ length: 20 }, (_, i) => `항목 ${i + 1}`);

  return (
    <div className="container">
      <h1>Fast Refresh 체감용 페이지</h1>
      <p>
        개발 서버(<code>pnpm dev</code>)를 띄우고 이 파일의 아무 문자열이나
        고쳐 저장해보세요. 변경이 반영되는 시간이 터미널 로그에 표시됩니다.
      </p>
      <div className="grid cols-2">
        {items.map((item) => (
          <div className="card" key={item}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
