import Link from "next/link";
import { apiUrl } from "@/lib/api-url";
import { RevalidateButton } from "@/components/revalidate-button";

export default async function CachedPage() {
  const url = await apiUrl("/api/now");

  // force-cache: 응답을 데이터 캐시에 저장하고 계속 재사용합니다.
  // tags: 무효화할 때 사용할 태그. revalidateTag("now-data")로 지웁니다.
  const res = await fetch(url, {
    cache: "force-cache",
    next: { tags: ["now-data"] },
  });
  const data = (await res.json()) as { counter: number; time: string };

  return (
    <div className="container">
      <h1>force-cache + 태그 무효화</h1>
      <div className="card">
        <p style={{ margin: "4px 0" }}>
          counter: <strong className="metric">{data.counter}</strong>
        </p>
        <p style={{ margin: "4px 0" }}>
          서버 시각: <span className="metric">{data.time}</span>
        </p>
      </div>
      <ol>
        <li>새로고침을 여러 번 해보세요. counter가 그대로입니다.</li>
        <li>
          아래 버튼으로 캐시를 무효화하면, 바로 다음 렌더는 아직 옛
          counter를 보여주고 백그라운드에서 새 값을 받아 둡니다. 한 번 더
          새로고침하면 counter가 증가합니다. (<code>"max"</code>의
          stale-while-revalidate 동작)
        </li>
      </ol>
      <RevalidateButton />
      <div className="note">
        <p style={{ margin: 0 }}>
          버튼은 <code>POST /api/revalidate</code>를 호출하고, 그 라우트는{" "}
          <code>{"revalidateTag(\"now-data\", \"max\")"}</code>를 실행합니다.
          Next.js 16부터 <code>revalidateTag</code>는 두 번째 인자로{" "}
          <code>cacheLife</code> 프로필(<code>"max"</code>,{" "}
          <code>"hours"</code> 등)을 요구합니다. Server Action 안에서는
          즉시 반영이 필요한 경우 <code>updateTag()</code>를 씁니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
