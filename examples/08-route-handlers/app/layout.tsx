import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Route Handlers",
  description: "nextjs-lab 예시: Route Handlers",
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
