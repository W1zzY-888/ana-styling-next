import { type Language, type LocalizedString } from "@/data/site";

export function text(value: LocalizedString | string, language: Language) {
  if (typeof value === "string") {
    return value;
  }

  const current = value[language] || value.en || value.ru || "";

  if (language === "ru" && current.includes("high-visibility moments")) {
    return "Полные образы для ужинов, запусков, свадеб и важных выходов.";
  }

  return current;
}

export function localized(value: LocalizedString | string): LocalizedString {
  if (typeof value === "string") {
    return { en: value, ru: value };
  }

  return { en: value.en || value.ru || "", ru: value.ru || value.en || "" };
}
