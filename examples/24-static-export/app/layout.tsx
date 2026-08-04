import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "정적 export",
  description: "nextjs-lab 예시: 정적 export",
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
