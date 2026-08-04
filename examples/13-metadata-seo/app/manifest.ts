import type { MetadataRoute } from "next";

// app/manifest.ts → /manifest.webmanifest (PWA 매니페스트)를 생성합니다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "nextjs-lab 상점",
    short_name: "nextjs-lab",
    description: "Next.js Metadata와 SEO 예시 상점",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d12",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
