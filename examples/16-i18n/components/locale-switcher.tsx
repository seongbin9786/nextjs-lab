"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

// 현재 경로의 첫 세그먼트(locale)만 갈아끼우는 링크를 만듭니다.
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/[^/]+/, "") || "";

  return (
    <span style={{ display: "inline-flex", gap: 8 }}>
      {locales.map((locale) =>
        locale === current ? (
          <strong key={locale}>{locale.toUpperCase()}</strong>
        ) : (
          <Link key={locale} href={`/${locale}${rest}`}>
            {locale.toUpperCase()}
          </Link>
        ),
      )}
    </span>
  );
}
