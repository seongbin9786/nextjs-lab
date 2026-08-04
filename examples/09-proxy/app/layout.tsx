import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "proxy.ts",
  description: "nextjs-lab 예시: proxy.ts",
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
