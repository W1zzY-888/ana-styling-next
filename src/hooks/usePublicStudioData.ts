"use client";

import { useEffect, useState } from "react";
import { initialStudioData, type StudioData } from "@/data/site";
import { isSupabaseConfigured, loadStudioDataFromSupabase, loadSubmittedReviews } from "@/lib/supabase-studio";
import { loadStudioData, normalizeStudioData } from "@/lib/studio-store";

export function usePublicStudioData() {
  const [data, setData] = useState<StudioData | null>(() => (isSupabaseConfigured ? null : initialStudioData));
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;
    let isRefreshing = false;

    async function loadPublicData() {
      if (isRefreshing || !isMounted) return;
      isRefreshing = true;
      try {
        if (!isSupabaseConfigured) {
          setData(loadStudioData());
          setIsLoading(false);
          return;
        }

        const [remote, submittedReviews] = await Promise.all([loadStudioDataFromSupabase(), loadSubmittedReviews()]);
        if (isMounted) {
          const normalized = remote ? normalizeStudioData(remote.data) : initialStudioData;
          setData({ ...normalized, reviews: [...normalized.reviews, ...submittedReviews.filter((review) => review.published)] });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Ana Styling could not load public studio data.", error);
        if (isMounted) {
          setData(initialStudioData);
          setIsLoading(false);
        }
      } finally {
        isRefreshing = false;
      }
    }

    loadPublicData();
    const refresh = () => {
      if (document.visibilityState === "visible") void loadPublicData();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 30000);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.clearInterval(interval);
    };
  }, []);

  return { data, isLoading };
}
