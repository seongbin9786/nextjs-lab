import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "View Transitions",
  description: "nextjs-lab 예시: View Transitions",
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
