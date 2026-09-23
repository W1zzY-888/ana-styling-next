"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type Language } from "@/data/site";
import { reviewPhotoMessages, validateReviewPhoto } from "@/lib/review-photo";

export type SelectedReviewPhoto = { file: File; preview: string };

export function ReviewPhotoInput({ photo, onChange, language }: {
  photo: SelectedReviewPhoto | null;
  onChange: (photo: SelectedReviewPhoto | null) => void;
  language: Language;
}) {
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [error, setError] = useState<"format" | "size" | null>(null);
  const t = reviewPhotoMessages[language];
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.preview); }, [photo]);

  return <div className="review-photo-picker">
    <div className="review-photo-picker-actions">
      <button type="button" className="review-photo-button" aria-describedby={hintId} onClick={() => input.current?.click()}>{t.add}</button>
      <span>{t.optional}</span>
    </div>
    <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" aria-label={t.add} onChange={(event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      const invalid = validateReviewPhoto(file);
      setError(invalid);
      if (!invalid) onChange({ file, preview: URL.createObjectURL(file) });
    }} />
    <small id={hintId}>{t.hint}</small>
    {error && <p className="form-note" role="alert">{t[error]}</p>}
    {photo && <div className="review-photo-selection">
      <img src={photo.preview} alt={t.preview} />
      <button type="button" className="review-photo-button" onClick={() => { onChange(null); setError(null); }}>{t.remove}</button>
    </div>}
  </div>;
}
