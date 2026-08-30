import { type Language, type LocalizedString } from "@/data/site";

export function text(value: LocalizedString | string, language: Language) {
  if (typeof value === "string") {
    return value;
  }

  return value[language] || value.en || value.ru || "";
}

export function localized(value: LocalizedString | string): LocalizedString {
  if (typeof value === "string") {
    return { en: value, ru: value };
  }

  return { en: value.en || value.ru || "", ru: value.ru || value.en || "" };
}
