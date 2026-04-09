"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "blood-arena-combat-feedback";

function readStoredEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function useSfxPreference() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    startTransition(() => setEnabled(readStoredEnabled()));
  }, []);

  const setEnabledPersist = useCallback((next: boolean) => {
    setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCombatFeedback = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return {
    combatFeedbackEnabled: enabled,
    setCombatFeedbackEnabled: setEnabledPersist,
    toggleCombatFeedback,
  };
}
