import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "데이터 fetching과 캐싱",
  description: "nextjs-lab 예시: 데이터 fetching과 캐싱",
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
