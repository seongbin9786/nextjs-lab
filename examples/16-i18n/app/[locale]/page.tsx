import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";

export function generateStaticParams() {
  return [{ locale: "ko" }, { locale: "en" }];
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.greeting}</p>
      <p>{dict.home.description}</p>
      <div className="card">
        <p style={{ margin: 0 }}>
          {dict.home.currentLocale}:{" "}
          <strong className="metric">{locale}</strong>
        </p>
      </div>
      <div className="note">
        <p style={{ margin: 0 }}>
          주소 구조: <code>/[locale]/page.tsx</code> — 언어가 URL의 일부입니다.
          정적 생성도 언어별로 일어납니다(빌드 출력에서{" "}
          <code>/ko</code>, <code>/en</code> 두 라우트를 확인하세요).
        </p>
      </div>
    </>
  );
}
