import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "동적 라우팅",
  description: "nextjs-lab 예시: 동적 라우팅",
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
