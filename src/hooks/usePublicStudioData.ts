"use client";

import { useEffect, useState } from "react";
import { initialStudioData, type StudioData } from "@/data/site";
import { isSupabaseConfigured, loadStudioDataFromSupabase } from "@/lib/supabase-studio";
import { loadStudioData, normalizeStudioData } from "@/lib/studio-store";

export function usePublicStudioData() {
  const [data, setData] = useState<StudioData>(initialStudioData);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicData() {
      try {
        if (!isSupabaseConfigured) {
          setData(loadStudioData());
          return;
        }

        const remote = await loadStudioDataFromSupabase();
        if (remote && isMounted) {
          setData(normalizeStudioData(remote.data));
        }
      } catch (error) {
        console.error("Ana Styling could not load public studio data.", error);
        if (isMounted) setData(initialStudioData);
      }
    }

    loadPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { data };
}
