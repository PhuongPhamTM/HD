"use client";

import { useHubStore } from "@/lib/store/useHubStore";
import { parseThumbnailUrl } from "@/lib/domain/thumbnail";
import { openContentEditor } from "@/features/content-editor/contentEditorEvents";
import type { MediaLibraryProps } from "./media.types";

export function useMediaController(): MediaLibraryProps {
  const contentItems = useHubStore((state) => state.content);
  const publications = useHubStore((state) => state.publications);
  const updateContent = useHubStore((state) => state.updateContent);
  const removeContent = useHubStore((state) => state.removeContent);

  const assets = contentItems
    .filter((contentItem) => ["approved", "published"].includes(contentItem.status))
    .map((contentAsset) => {
      const relatedPublications = publications.filter(
        (publication) => publication.content === contentAsset.id,
      );
      const publishedLinks = [
        ...new Map(
          relatedPublications
            .filter((publication) => publication.url)
            .map((publication) => [publication.url, publication]),
        ).values(),
      ].map((publication) => ({
        id: publication.id,
        url: publication.url,
        channel: publication.channel,
      }));
      return {
        id: contentAsset.id,
        title: contentAsset.title,
        format: contentAsset.format,
        usageCount: relatedPublications.length,
        publishedLinks,
        sourceUrl: typeof contentAsset.sourceURL === "string" ? contentAsset.sourceURL : "",
        thumbnailUrl: contentAsset.thumbnail ?? "",
      };
    });

  return {
    assets,
    formats: [...new Set(contentItems.map((contentItem) => contentItem.format).filter(Boolean))],
    onThumbnailSave(assetId, thumbnailUrl) {
      const parsed = parseThumbnailUrl(thumbnailUrl);
      if (!parsed.ok) return parsed.message;
      // Saved like any other content edit: locally first, then to the Content tab of the Sheet.
      updateContent(assetId, { thumbnail: parsed.url });
      return null;
    },
    onEditAsset: openContentEditor,
    onDeleteAsset: removeContent,
  };
}
