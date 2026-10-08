"use client";

import { useEffect, useState } from "react";

type Entry = { name: string; at: number };

// window.__loadedScripts에 기록된 스크립트 로드 시각을
// 페이지 표시 시각과 비교해서 보여줍니다.
// 기준 시각은 브라우저에서 이 컴포넌트가 hydration된 순간입니다. 서버 컴포넌트의
// Date.now()를 넘기면 정적 생성 페이지에서는 빌드 시각이 되어 차이가 분·시간
// 단위로 커집니다.
export function ScriptLoadMonitor() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [pageShownAt, setPageShownAt] = useState<number | null>(null);

  useEffect(() => {
    setPageShownAt(Date.now());
    const update = () => {
      const list = (window as unknown as { __loadedScripts?: Entry[] })
        .__loadedScripts;
      if (list) setEntries([...list]);
    };
    update();
    const timer = setInterval(update, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>스크립트 로드 시각</h3>
      {entries.length === 0 || pageShownAt === null ? (
        <p className="muted" style={{ margin: 0 }}>
          아직 로드된 스크립트가 없습니다…
        </p>
      ) : (
        <table style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>스크립트</th>
              <th>페이지 표시 후</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const delta = e.at - pageShownAt;
              return (
                <tr key={e.name}>
                  <td className="metric">{e.name}</td>
                  <td className="metric">
                    {delta >= 0
                      ? `+${delta}ms`
                      : `${delta}ms (페이지 JS보다 먼저 실행됨)`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
