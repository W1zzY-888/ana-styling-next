"use client";

import { useState } from "react";
import { type Language, type Review } from "@/data/site";
import { text } from "@/lib/i18n";
import { ReviewRating } from "@/components/ReviewRating";

function ReviewEntry({ review, language }: { review: Review; language: Language }) {
  const [expanded, setExpanded] = useState(false);
  const body = text(review.text, language);
  const isLong = body.length > 180 || body.split("\n").length > 3;
  const date = new Date(review.createdAt);
  const validDate = Number.isFinite(date.getTime());
  const mood = review.rating ? ["😠", "🙁", "😐", "🙂", "😊"][review.rating - 1] : null;
  return <article className="review-card">
    <div>
      <div className="review-author">
        <h3>{mood && <span className="review-mood" aria-hidden="true">{mood}</span>}{review.name}</h3>
        {validDate && <time dateTime={date.toISOString()}>
          {new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
            day: "numeric", month: "short", year: "numeric", timeZone: "America/New_York",
          }).format(date)}
        </time>}
      </div>
      <ReviewRating value={review.rating} language={language} />
      <p className={!expanded && isLong ? "review-body is-collapsed" : "review-body"}>{body}</p>
      {isLong && <button className="review-read-more" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {language === "ru" ? (expanded ? "Свернуть" : "Читать полностью") : (expanded ? "Show less" : "Read more")}
      </button>}
    </div>
  </article>;
}

export function ReviewsList({ reviews, language, isFullPage, allHref }: {
  reviews: Review[]; language: Language; isFullPage?: boolean; allHref: string;
}) {
  const [page, setPage] = useState(0);
  const pageSize = isFullPage ? 6 : 3;
  const pages = Math.max(1, Math.ceil(reviews.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const start = isFullPage ? currentPage * pageSize : 0;
  return <div className="reviews-list">
    <div className="reviews-grid" aria-live="polite">
      {reviews.length === 0 && <p className="reviews-empty">{language === "ru" ? "Будьте первым, кто поделится впечатлениями." : "Be the first to share your experience."}</p>}
      {reviews.slice(start, start + pageSize).map(review => <ReviewEntry key={`${review.id}-${language}`} review={review} language={language} />)}
    </div>
    {!isFullPage && <a className="section-link reviews-all-link" href={allHref}>{language === "ru" ? "Все отзывы" : "All reviews"} ({reviews.length}) →</a>}
    {isFullPage && pages > 1 && <nav className="reviews-pagination" aria-label={language === "ru" ? "Страницы отзывов" : "Review pages"}>
      <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label={language === "ru" ? "Предыдущая страница" : "Previous page"}>←</button>
      <span>{language === "ru" ? "Страница" : "Page"} {currentPage + 1} / {pages}</span>
      <button type="button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} aria-label={language === "ru" ? "Следующая страница" : "Next page"}>→</button>
    </nav>}
  </div>;
}
