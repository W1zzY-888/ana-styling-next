"use client";

import { useEffect, useState } from "react";
import { type StudioData } from "@/data/site";
import { loadStudioData, saveStudioData } from "@/lib/studio-store";
import { loadStudioDataFromSupabase, saveStudioDataToSupabase, seedStudioDataInSupabase } from "@/lib/supabase-studio";

export function useStudioData() {
  const [data, setData] = useState<StudioData>(() => loadStudioData());
  const [saveError, setSaveError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function syncRemoteData() {
      setIsSyncing(true);
      await seedStudioDataInSupabase();
      const remoteData = await loadStudioDataFromSupabase();

      if (remoteData && isMounted) {
        saveStudioData(remoteData);
        setData(remoteData);
      }

      if (isMounted) setIsSyncing(false);
    }

    syncRemoteData();

    function handleStorage(event: StorageEvent) {
      if (event.key) {
        setData(loadStudioData());
      }
    }

    function handleStudioChange(event: Event) {
      setData((event as CustomEvent<StudioData>).detail);
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("studio-data-change", handleStudioChange);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("studio-data-change", handleStudioChange);
    };
  }, []);

  function updateData(updater: (current: StudioData) => StudioData) {
    const next = updater(data);
    const saved = saveStudioData(next);

    setData(next);
    setSaveError(saved ? "" : "This change could not be saved on this device. Please use a smaller image and try again.");
    saveStudioDataToSupabase(next).then((remoteSaved) => {
      if (!remoteSaved) setSaveError("This change could not be saved online. Please try again.");
    });
  }

  return { data, isSyncing, saveError, updateData };
}
