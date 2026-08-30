"use client";

import { useEffect, useState } from "react";
import { type StudioData } from "@/data/site";
import { loadStudioData, saveStudioData } from "@/lib/studio-store";

export function useStudioData() {
  const [data, setData] = useState<StudioData>(() => loadStudioData());

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
      saveStudioData(next);
      return next;
    });
  }

  return { data, updateData };
}
