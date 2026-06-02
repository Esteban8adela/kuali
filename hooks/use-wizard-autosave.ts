"use client";

import { useCallback, useEffect, useRef } from "react";
import { registerWizardDraftSave } from "@/lib/wizard/draft-registry";

export function useWizardAutosave(
  saveFn: () => Promise<void>,
  deps: unknown[],
  enabled = true
) {
  const saveRef = useRef(saveFn);
  saveRef.current = saveFn;

  const stableSave = useCallback(async () => {
    await saveRef.current();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      void stableSave();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, stableSave]);

  useEffect(() => {
    if (!enabled) return;
    return registerWizardDraftSave(stableSave);
  }, [enabled, stableSave]);
}
