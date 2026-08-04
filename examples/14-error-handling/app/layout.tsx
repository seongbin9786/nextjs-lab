import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "에러 처리",
  description: "nextjs-lab 예시: 에러 처리",
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
