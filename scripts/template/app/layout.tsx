import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "__TITLE__",
  description: "nextjs-lab 예시: __TITLE__",
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
