import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales, type Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/locale-switcher";

// [locale] 아래 모든 페이지가 이 레이아웃을 공유합니다.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 지원하지 않는 언어면 404. (/fr 등으로 들어온 경우)
  if (!isLocale(locale)) {
    notFound();
  }

  const dict = getDictionary(locale);

  return (
    <>
      <nav className="topnav">
        <strong>nextjs-lab i18n</strong>
        <Link href={`/${locale}`}>{dict.nav.home}</Link>
        <Link href={`/${locale}/about`}>{dict.nav.about}</Link>
        <span style={{ marginLeft: "auto" }}>
          <LocaleSwitcher current={locale} />
        </span>
      </nav>
      <main className="container">{children}</main>
    </>
  );
}

// 검색엔진에 "이 페이지의 다른 언어 버전"을 알려줍니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `/example-base/${l}`;
  }
  return {
    alternates: {
      languages,
    },
  };
}
