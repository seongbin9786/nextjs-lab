import Link from "next/link";

export default function TailwindPage() {
  return (
    <div className="container">
      <h1>Tailwind CSS v4</h1>
      <p>
        이 박스들은 전부 Tailwind 유틸리티 클래스로 만들었습니다. HTML에서
        클래스만 보면 스타일을 알 수 있습니다.
      </p>

      <div className="rounded-xl border border-blue-400/40 bg-blue-500/10 p-5">
        <h2 className="mt-0 text-lg font-semibold text-blue-500">
          유틸리티 클래스 박스
        </h2>
        <p className="mb-0 text-sm opacity-80">
          <code>rounded-xl border border-blue-400/40 bg-blue-500/10 p-5</code>
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-emerald-500/15 p-4 text-center">
          <span className="block text-2xl font-bold text-emerald-500">1</span>
          <span className="text-xs opacity-70">grid 반응형</span>
        </div>
        <div className="rounded-lg bg-amber-500/15 p-4 text-center">
          <span className="block text-2xl font-bold text-amber-500">2</span>
          <span className="text-xs opacity-70">sm:grid-cols-3</span>
        </div>
        <div className="rounded-lg bg-rose-500/15 p-4 text-center">
          <span className="block text-2xl font-bold text-rose-500">3</span>
          <span className="text-xs opacity-70">모바일에선 1열</span>
        </div>
      </div>

      <h2>설정 (Tailwind v4)</h2>
      <pre>
        <code>{`// postcss.config.mjs
export default { plugins: ["@tailwindcss/postcss"] };

// globals.css
@import "tailwindcss";`}</code>
      </pre>
      <div className="note">
        <p style={{ margin: 0 }}>
          v4부터는 <code>tailwind.config.js</code> 없이 CSS의{" "}
          <code>@theme</code>으로 토큰을 정의합니다. <code>@layer</code>{" "}
          덕분에 이 예시의 커스텀 전역 CSS와 섞어 써도 우선순위가
          예측 가능합니다.
        </p>
      </div>
      <p>
        <Link href="/">← 홈으로</Link>
      </p>
    </div>
  );
}
