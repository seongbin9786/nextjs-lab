import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "환경 변수",
  description: "nextjs-lab 예시: 환경 변수",
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
