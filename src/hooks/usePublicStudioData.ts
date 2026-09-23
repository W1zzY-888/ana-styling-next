"use client";

import { useEffect, useState } from "react";
import { initialStudioData, type StudioData } from "@/data/site";
import { isSupabaseConfigured, loadStudioDataFromSupabase, loadSubmittedReviews } from "@/lib/supabase-studio";
import { loadStudioData, normalizeStudioData } from "@/lib/studio-store";

export function usePublicStudioData(initialData: StudioData = initialStudioData) {
  const [data, setData] = useState<StudioData>(initialData);
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
          if (!remote) return;
          const normalized = normalizeStudioData(remote.data);
          setData({ ...normalized, reviews: [...normalized.reviews, ...submittedReviews.filter((review) => review.published)] });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Ana Styling could not load public studio data.", error);
        if (isMounted) {
          // Keep the last known public snapshot during transient network failures.
          setIsLoading(false);
        }
      } finally {
        isRefreshing = false;
        if (isMounted) setIsLoading(false);
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
