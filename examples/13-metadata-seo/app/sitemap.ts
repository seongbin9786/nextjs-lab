import type { MetadataRoute } from "next";
import { products } from "@/lib/products";

// app/sitemap.ts → /sitemap.xml 을 자동 생성합니다.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nextjs-lab.example.com";

  const staticRoutes = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${base}/jsonld`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
  ];

  const productRoutes = products.map((p) => ({
    url: `${base}/products/${p.id}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
