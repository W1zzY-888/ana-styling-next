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

    async function loadPublicData() {
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
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data, isLoading };
}
