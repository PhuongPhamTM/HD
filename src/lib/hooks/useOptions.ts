"use client";
import { useMemo } from "react";
import { optionLabelMap } from "@/lib/domain/options";
import { useHubStore } from "@/lib/store/useHubStore";

/** Option lists managed in the Sheet's Options tab, plus label lookups for display. */
export function useOptions() {
  const options = useHubStore((state) => state.options);
  return useMemo(
    () => ({
      ...options,
      stageLabel: optionLabelMap(options.stages),
      publicationStatusLabel: optionLabelMap(options.publicationStatuses),
    }),
    [options],
  );
}
