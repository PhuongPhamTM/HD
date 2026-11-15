"use client";
import { useEffect } from "react";
import { useHubStore } from "@/lib/store/useHubStore";

/** How stale the data may get before returning to the tab reloads it from the Sheet. */
const REFRESH_AFTER_MS = 30_000;

/**
 * Loads the workspace from Google Sheets once the local cache has hydrated, and reloads it
 * when the user comes back to the tab, so edits made by teammates or in the Sheet show up.
 */
export function useSheetSync(actorName: string) {
  useEffect(() => {
    useHubStore.getState().setActorName(actorName);
  }, [actorName]);

  useEffect(() => {
    const load = () => void useHubStore.getState().loadFromSheet();
    const unsubscribe = useHubStore.persist.hasHydrated()
      ? (load(), undefined)
      : useHubStore.persist.onFinishHydration(load);

    function refreshWhenStale() {
      const { sync } = useHubStore.getState();
      if (document.visibilityState !== "visible" || sync.loading || sync.pendingWrites) return;
      if (Date.now() - sync.lastLoadedAt > REFRESH_AFTER_MS) load();
    }
    window.addEventListener("focus", refreshWhenStale);
    document.addEventListener("visibilitychange", refreshWhenStale);
    return () => {
      unsubscribe?.();
      window.removeEventListener("focus", refreshWhenStale);
      document.removeEventListener("visibilitychange", refreshWhenStale);
    };
  }, []);
}
