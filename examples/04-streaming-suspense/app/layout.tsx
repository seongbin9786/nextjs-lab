import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스트리밍과 Suspense",
  description: "nextjs-lab 예시: 스트리밍과 Suspense",
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
