import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale, locales } from "@/lib/i18n";

// 루트(/)로 들어오면 브라우저 언어를 보고 기본 언어 경로로 보냅니다.
export default async function RootPage() {
  const h = await headers();
  const acceptLanguage = h.get("accept-language") ?? "";
  const preferred = acceptLanguage
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase())
    .find((code) => locales.includes(code as (typeof locales)[number]));

  redirect(`/${preferred && isLocale(preferred) ? preferred : defaultLocale}`);
}
