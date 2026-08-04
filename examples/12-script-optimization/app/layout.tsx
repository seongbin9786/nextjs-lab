import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "스크립트 최적화 | nextjs-lab",
    template: "%s | 스크립트 최적화",
  },
  description: "next/script로 서드파티 스크립트 로딩을 제어하는 예시",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {/* beforeInteractive는 루트 레이아웃에서만 쓸 수 있습니다.
            초기 HTML에 주입되어, 아래 tracker.js 등 다른 스크립트가
            시작 시각을 잴 수 있게 합니다. */}
        <Script id="page-start" strategy="beforeInteractive">
          {`window.__loadedScripts = window.__loadedScripts || [];
window.__loadedScripts.push({ name: "page-start.js (beforeInteractive)", at: Date.now() });`}
        </Script>
        {children}
      </body>
    </html>
  );
}
