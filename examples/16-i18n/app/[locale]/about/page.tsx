import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <>
      <h1>{dict.about.title}</h1>
      <p>{dict.about.body}</p>
      <h2>파일 구조</h2>
      <pre>
        <code>{`app/
  page.tsx                  # / → 언어 감지 후 /ko 또는 /en로 리다이렉트
  [locale]/
    layout.tsx              # locale 검증 + 공통 내비게이션
    page.tsx                # /ko, /en
    about/page.tsx          # /ko/about, /en/about
lib/i18n.ts                 # locale 목록 + 사전(dictionary)`}</code>
      </pre>
      <div className="note">
        <p style={{ margin: 0 }}>
          <strong>실전 확장</strong>: (1) 사전은 JSON 파일이나 CMS에서 가져오고,{" "}
          (2) 날짜/숫자는 <code>Intl</code> API로 포맷하고, (3) 언어 쿠키를
          저장해 다음 방문 때 기억하는 순서로 발전시킵니다.
        </p>
      </div>
    </>
  );
}
