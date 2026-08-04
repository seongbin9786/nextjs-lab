import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Server Actions와 폼",
  description: "nextjs-lab 예시: Server Actions와 폼",
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
