"use client";

import { useId } from "react";
import { type Language } from "@/data/site";

export function ReviewRating({ value, onChange, language = "en" }: {
  value: number | null;
  onChange?: (value: number) => void;
  language?: Language;
}) {
  const id = useId();
  const label = language === "ru" ? "Оценка" : "Rating";
  const score = (rating: number) => language === "ru" ? `${rating} из 5` : `${rating} out of 5`;

  if (!onChange) {
    if (!value) return null;
    return <div className="review-stars-display" role="img" aria-label={`${label}: ${score(value)}`}>
      {[1, 2, 3, 4, 5].map((star) => <span key={star} aria-hidden="true">{star <= value ? "★" : "☆"}</span>)}
    </div>;
  }

  return <fieldset className="review-rating">
    <legend>{label}</legend>
    <div className="review-stars-input">
      {[1, 2, 3, 4, 5].map((star) => <label key={star} className="review-star-option" title={score(star)}>
        <input type="radio" name={`rating-${id}`} value={star} checked={value === star} onChange={() => onChange(star)} aria-label={score(star)} required />
        <span aria-hidden="true">{star <= (value ?? 0) ? "★" : "☆"}</span>
      </label>)}
      <output className="review-rating-value" aria-live="polite">{value ? `${value}/5` : ""}</output>
    </div>
  </fieldset>;
}
