import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "standalone과 Docker",
  description: "nextjs-lab 예시: standalone과 Docker",
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
