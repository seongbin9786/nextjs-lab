import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "서버 vs 클라이언트 컴포넌트",
  description: "nextjs-lab 예시: 서버 vs 클라이언트 컴포넌트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
