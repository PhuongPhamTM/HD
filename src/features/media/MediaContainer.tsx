"use client";

import { MediaLibrary } from "@/components/organisms/MediaLibrary";
import { useMediaController } from "./useMediaController";

export function MediaContainer() {
  const mediaProps = useMediaController();

  return <MediaLibrary {...mediaProps} />;
}
