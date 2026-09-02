"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type StudioData } from "@/data/site";
import { loadStudioData, saveStudioData } from "@/lib/studio-store";
import { loadStudioDataFromSupabase, saveStudioDataToSupabase } from "@/lib/supabase-studio";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function sameStudioData(a: StudioData, b: StudioData) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useStudioData() {
  const [data, setData] = useState<StudioData>(() => loadStudioData());
  const [savedData, setSavedData] = useState<StudioData>(() => loadStudioData());
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSyncing, setIsSyncing] = useState(false);
  const hasLocalDraftRef = useRef(false);
  const isSavingRef = useRef(false);
  const lastFailedDraftRef = useRef<StudioData | null>(null);

  const hasUnsavedChanges = !sameStudioData(data, savedData);

  useEffect(() => {
    let isMounted = true;

    async function syncRemoteData() {
      setIsSyncing(true);
      const remote = await loadStudioDataFromSupabase();

      if (remote && isMounted && !hasLocalDraftRef.current) {
        saveStudioData(remote.data);
        setSavedData(remote.data);
        setData(remote.data);
        setSaveStatus("idle");
      }

      if (isMounted) setIsSyncing(false);
    }

    syncRemoteData();

    function handleStorage(event: StorageEvent) {
      if (event.key) {
        const localData = loadStudioData();
        if (!hasLocalDraftRef.current) {
          setData(localData);
          setSavedData(localData);
        }
      }
    }

    function handleStudioChange(event: Event) {
      if (!hasLocalDraftRef.current) {
        const next = (event as CustomEvent<StudioData>).detail;
        setData(next);
        setSavedData(next);
      }
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
      hasLocalDraftRef.current = true;
      setSaveError("");
      setSaveStatus("dirty");
      return next;
    });
  }

  const saveChanges = useCallback(async (override?: StudioData) => {
    if (isSavingRef.current) return false;
    const draft = override ?? data;

    if (sameStudioData(draft, savedData)) {
      setSaveStatus("saved");
      return true;
    }

    isSavingRef.current = true;
    setSaveStatus("saving");
    setSaveError("");

    const result = await saveStudioDataToSupabase(draft);

    if (!result.ok) {
      lastFailedDraftRef.current = draft;
      setSaveStatus("error");
      setSaveError(result.message);
      isSavingRef.current = false;
      return false;
    }

    saveStudioData(result.data);
    setSavedData(result.data);
    setData(result.data);
    hasLocalDraftRef.current = false;
    lastFailedDraftRef.current = null;
    setSaveStatus("saved");
    isSavingRef.current = false;
    return true;
  }, [data, savedData]);

  function retrySave() {
    return saveChanges(lastFailedDraftRef.current ?? data);
  }

  function discardDraft() {
    hasLocalDraftRef.current = false;
    lastFailedDraftRef.current = null;
    setSaveError("");
    setSaveStatus("idle");
    setData(savedData);
  }

  const visibleSaveStatus: SaveStatus =
    hasUnsavedChanges && saveStatus !== "saving" && saveStatus !== "error"
      ? "dirty"
      : !hasUnsavedChanges && saveStatus === "dirty"
        ? "idle"
        : saveStatus;

  return { data, discardDraft, hasUnsavedChanges, isSyncing, retrySave, saveChanges, saveError, saveStatus: visibleSaveStatus, updateData };
}
