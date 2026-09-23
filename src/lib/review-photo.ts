export const REVIEW_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export function validateReviewPhoto(file: File): "format" | "size" | null {
  const extensions: Record<string, RegExp> = {
    "image/jpeg": /\.jpe?g$/i,
    "image/png": /\.png$/i,
    "image/webp": /\.webp$/i,
  };
  if (!extensions[file.type]?.test(file.name)) return "format";
  if (!file.size || file.size > REVIEW_PHOTO_MAX_BYTES) return "size";
  return null;
}

export const reviewPhotoMessages = {
  en: {
    add: "ADD PHOTO", optional: "Optional", remove: "Remove photo",
    preview: "Selected review photo", hint: "JPEG, PNG or WebP · Up to 10 MB",
    format: "Choose a JPEG, PNG or WebP image.",
    size: "Choose a non-empty image up to 10 MB.",
    upload: "Couldn’t upload the photo. Your review was not sent. Please try again.",
  },
  ru: {
    add: "ДОБАВИТЬ ФОТО", optional: "Необязательно", remove: "Удалить фото",
    preview: "Выбранное фото к отзыву", hint: "JPEG, PNG или WebP · До 10 МБ",
    format: "Выберите изображение JPEG, PNG или WebP.",
    size: "Выберите непустое изображение размером до 10 МБ.",
    upload: "Не удалось загрузить фото. Отзыв не отправлен. Попробуйте ещё раз.",
  },
};
