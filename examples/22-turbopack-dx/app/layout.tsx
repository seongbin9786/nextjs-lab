import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turbopack DX",
  description: "nextjs-lab 예시: Turbopack DX",
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
