"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initialStudioData, type StudioData } from "@/data/site";
import { jsonEqual } from "@/lib/json-equal";
import { loadStudioData, normalizeStudioData, saveStudioData } from "@/lib/studio-store";
import { loadStudioDataFromSupabase, saveStudioDataToSupabase } from "@/lib/supabase-studio";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

function sameStudioData(a: StudioData, b: StudioData) {
  return jsonEqual(a, b);
}

export function useStudioData() {
  const [data, setData] = useState<StudioData>(initialStudioData);
  const [savedData, setSavedData] = useState<StudioData>(initialStudioData);
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [isSyncing, setIsSyncing] = useState(false);
  const hasLocalDraftRef = useRef(false);
  const isSavingRef = useRef(false);

  const hasUnsavedChanges = !sameStudioData(data, savedData);

  useEffect(() => {
    let isMounted = true;

    async function syncRemoteData() {
      setIsSyncing(true);
      const remote = await loadStudioDataFromSupabase();

      if (isMounted && !hasLocalDraftRef.current) {
        const normalized = remote ? normalizeStudioData(remote.data) : loadStudioData();
        if (remote) saveStudioData(normalized);
        setSavedData(normalized);
        setData(normalized);
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

    try {
      const result = await saveStudioDataToSupabase(draft);

      if (!result.ok) {
        setSaveStatus("error");
        setSaveError(result.message);
        return false;
      }

      saveStudioData(result.data);
      setSavedData(result.data);
      setData((current) => {
        const unchanged = sameStudioData(current, draft);
        hasLocalDraftRef.current = !unchanged;
        return unchanged ? result.data : current;
      });
      setSaveStatus("saved");
      return true;
    } catch (error) {
      console.error("Ana Styling could not save studio data.", error);
      setSaveStatus("error");
      setSaveError("Couldn’t save — Retry");
      return false;
    } finally {
      isSavingRef.current = false;
    }
  }, [data, savedData]);

  function retrySave() {
    return saveChanges(data);
  }

  function discardDraft() {
    hasLocalDraftRef.current = false;
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
