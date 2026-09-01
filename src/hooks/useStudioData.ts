"use client";

import { useEffect, useState } from "react";
import { type StudioData } from "@/data/site";
import { loadStudioData, saveStudioData } from "@/lib/studio-store";

export function useStudioData() {
  const [data, setData] = useState<StudioData>(() => loadStudioData());
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
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
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("studio-data-change", handleStudioChange);
    };
  }, []);

  function updateData(updater: (current: StudioData) => StudioData) {
    setData((current) => {
      const next = updater(current);
      const saved = saveStudioData(next);
      setSaveError(saved ? "" : "The browser could not save this change. Please use a smaller image and try again.");
      return next;
    });
  }

  return { data, saveError, updateData };
}
