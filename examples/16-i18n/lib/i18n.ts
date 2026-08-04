export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const dictionaries = {
  ko: {
    nav: { home: "홈", about: "소개" },
    home: {
      title: "다국어 라우팅 예시",
      greeting: "안녕하세요! 이 페이지는 한국어 사전으로 렌더링됐습니다.",
      description:
        "URL의 첫 세그먼트(/ko, /en)가 언어를 결정합니다. 오른쪽 위 버튼으로 언어를 바꿔보세요.",
      currentLocale: "현재 언어",
    },
    about: {
      title: "이 예시의 구조",
      body: "app/[locale] 폴더 아래 모든 페이지가 locale 파라미터를 받습니다. 레이아웃에서 locale을 검증하고, 사전(dictionary)에서 문구를 꺼냅니다.",
    },
  },
  en: {
    nav: { home: "Home", about: "About" },
    home: {
      title: "i18n Routing Example",
      greeting: "Hello! This page was rendered with the English dictionary.",
      description:
        "The first URL segment (/ko, /en) decides the language. Use the buttons above to switch.",
      currentLocale: "Current locale",
    },
    about: {
      title: "How this example is structured",
      body: "Every page under app/[locale] receives the locale param. The layout validates it and the dictionary provides the strings.",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: string): Dictionary {
  if (isLocale(locale)) return dictionaries[locale];
  return dictionaries[defaultLocale];
}
