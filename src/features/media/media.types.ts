export interface MediaPublishedLink {
  id: string;
  url: string;
  channel: string;
}

export interface MediaAssetViewModel {
  id: string;
  title: string;
  format: string;
  /** Number of publications that use this content. */
  usageCount: number;
  /** Publications with a URL, one per distinct URL. */
  publishedLinks: MediaPublishedLink[];
  /** Link back to the content tracker, or "". */
  sourceUrl: string;
  /** Cover image URL, or "" to show the gradient cover. */
  thumbnailUrl: string;
}

export interface MediaLibraryProps {
  /** Approved and published content; the view filters it by its own search and format. */
  assets: MediaAssetViewModel[];
  /** Formats in use across all content, for the format filter. */
  formats: string[];
  /**
   * Saves (or clears, with "") an asset's thumbnail URL. Returns an error message to show
   * next to the field, or null when it was saved.
   */
  onThumbnailSave(assetId: string, thumbnailUrl: string): string | null;
  /** Opens the content editor for the asset's content item. */
  onEditAsset(assetId: string): void;
  /** Deletes the asset's content item together with its publications. */
  onDeleteAsset(assetId: string): void;
}
