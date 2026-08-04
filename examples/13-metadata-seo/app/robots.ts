import type { MetadataRoute } from "next";

// app/robots.ts → /robots.txt 를 자동 생성합니다.
export default function robots(): MetadataRoute.Robots {
  const base = "https://nextjs-lab.example.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/private/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
