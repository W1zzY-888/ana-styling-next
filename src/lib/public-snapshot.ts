import { cache } from "react";
import { initialStudioData } from "@/data/site";
import { normalizeStudioData } from "@/lib/studio-store";
import { isSupabaseConfigured, loadStudioDataFromSupabase, loadSubmittedReviews } from "@/lib/supabase-studio";

// Static HTML contains public content for crawlers and link previews. The client
// continues to refresh from the same Supabase source after hydration.
export const getPublicStudioSnapshot = cache(async () => {
  if (!isSupabaseConfigured) return initialStudioData;
  const [remote, submittedReviews] = await Promise.all([loadStudioDataFromSupabase(), loadSubmittedReviews()]);
  if (!remote) throw new Error("Cannot build public pages: Supabase content is unavailable.");
  const normalized = normalizeStudioData(remote.data);
  return {
    ...normalized,
    reviews: [...normalized.reviews, ...submittedReviews.filter((review) => review.published)],
  };
});
