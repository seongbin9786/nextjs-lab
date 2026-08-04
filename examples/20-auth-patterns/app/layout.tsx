import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "인증 패턴",
  description: "nextjs-lab 예시: 인증 패턴",
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
