import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// next/font/local: 빌드 시 폰트 파일을 앱에 포함시키고
// @font-face CSS를 자동 생성합니다. 외부 요청이 전혀 없습니다.
const plex = localFont({
  src: "../public/fonts/ibm-plex-sans-kr-400.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: {
    default: "폰트 최적화 | nextjs-lab",
    template: "%s | 폰트 최적화",
  },
  description: "next/font로 웹 폰트를 최적화하는 예시",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
