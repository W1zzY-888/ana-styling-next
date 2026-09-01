"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type StudioData } from "@/data/site";
import { loadStudioData, saveStudioData } from "@/lib/studio-store";
import { loadStudioDataFromSupabase, saveStudioDataToSupabase } from "@/lib/supabase-studio";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useStudioData() {
  const [data, setData] = useState<StudioData>(() => loadStudioData());
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSyncing, setIsSyncing] = useState(false);
  const lastLocalEditRef = useRef(0);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef<StudioData | null>(null);
  const failedSaveRef = useRef<StudioData | null>(null);

  const flushSaveQueue = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    while (pendingSaveRef.current) {
      const snapshot = pendingSaveRef.current;
      pendingSaveRef.current = null;
      setSaveStatus("saving");
      setSaveError("");

      const result = await saveStudioDataToSupabase(snapshot);

      if (!result.ok) {
        failedSaveRef.current = snapshot;
        setSaveStatus("error");
        setSaveError(result.message);
        break;
      }

      failedSaveRef.current = null;
      saveStudioData(result.data);
      setData(result.data);
      setSaveStatus("saved");
    }

    isSavingRef.current = false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const remoteLoadStartedAt = Date.now();

    async function syncRemoteData() {
      setIsSyncing(true);
      const remote = await loadStudioDataFromSupabase();

      if (remote && isMounted && lastLocalEditRef.current <= remoteLoadStartedAt) {
        saveStudioData(remote.data);
        setData(remote.data);
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
    setData((current) => {
      const next = updater(current);
      lastLocalEditRef.current = Date.now();
      pendingSaveRef.current = next;
      saveStudioData(next);
      void flushSaveQueue();
      return next;
    });
  }

  function retrySave() {
    if (!failedSaveRef.current) return;
    pendingSaveRef.current = failedSaveRef.current;
    void flushSaveQueue();
  }

  return { data, isSyncing, retrySave, saveError, saveStatus, updateData };
}
