"use client";
import { useState } from "react";
import { PageHeader } from "./PageHeader";
import { Button, Input, Select, Tag } from "@/components/atoms/ui";
import { Icon } from "@/components/atoms/icons";
import { Card, EmptyState } from "@/components/molecules/ui";
import { Pagination } from "@/components/molecules/Pagination";
import { DEFAULT_PAGE_SIZE, usePagination } from "@/lib/hooks/usePagination";
import type { MediaAssetViewModel, MediaLibraryProps } from "@/features/media/media.types";
import { ContentActionMenu, DeleteContentDialog } from "./ContentActions";

const MEDIA_COVER_GRADIENTS = [
  "from-[#183c83] to-[#5f83c5]",
  "from-[#3b2d70] to-[#9a75c8]",
  "from-[#145f54] to-[#57a58d]",
  "from-[#8a402c] to-[#d48a5c]",
  "from-[#354052] to-[#8190a7]",
];
export function MediaLibrary({
  assets,
  formats: availableAssetFormats,
  onThumbnailSave,
  onEditAsset,
  onDeleteAsset,
}: MediaLibraryProps) {
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  // Own UI state: which asset the delete confirmation is open for.
  const [assetPendingDelete, setAssetPendingDelete] = useState<MediaAssetViewModel | null>(null);
  const [selectedAssetFormat, setSelectedAssetFormat] = useState("");
  const filteredAssets = assets.filter(
    (contentItem) =>
      (!assetSearchQuery ||
        contentItem.title.toLowerCase().includes(assetSearchQuery.toLowerCase())) &&
      (!selectedAssetFormat || contentItem.format === selectedAssetFormat),
  );
  const assetPagination = usePagination(
    filteredAssets,
    DEFAULT_PAGE_SIZE,
    `${assetSearchQuery}|${selectedAssetFormat}`,
  );
  return (
    <div className="media-library">
      <PageHeader
        title="Asset Library"
        description="Browse approved and published creative, ready to reuse across channels."
      />
      <Card className="mb-4">
        <div className="flex gap-2 p-3">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-3 top-2.5 size-4 text-faint" />
            <Input
              value={assetSearchQuery}
              onChange={(inputEvent) => setAssetSearchQuery(inputEvent.target.value)}
              className="pl-9"
              placeholder="Search assets…"
            />
          </div>
          <Select
            value={selectedAssetFormat}
            onChange={(selectEvent) => setSelectedAssetFormat(selectEvent.target.value)}
          >
            <option value="">All formats</option>
            {availableAssetFormats.map((assetFormat) => (
              <option key={assetFormat}>{assetFormat}</option>
            ))}
          </Select>
        </div>
      </Card>
      {filteredAssets.length ? (
        <>
          <div className="media-grid grid grid-cols-4 gap-4 max-[1100px]:grid-cols-3 max-[760px]:grid-cols-2 max-[470px]:grid-cols-1">
            {assetPagination.pageItems.map((contentAsset, pageIndex) => (
              <MediaCard
                key={contentAsset.id}
                asset={contentAsset}
                // Index across all pages, so cover colours stay stable when paging.
                gradient={
                  MEDIA_COVER_GRADIENTS[
                    (assetPagination.rangeStart - 1 + pageIndex) % MEDIA_COVER_GRADIENTS.length
                  ]
                }
                onThumbnailSave={onThumbnailSave}
                onEdit={() => onEditAsset(contentAsset.id)}
                onDelete={() => setAssetPendingDelete(contentAsset)}
              />
            ))}
          </div>
          <Card className="media-library__pagination mt-4">
            <Pagination pagination={assetPagination} itemLabel="assets" />
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState title="No assets found" body="Approved and published content appears here." />
        </Card>
      )}
      <DeleteContentDialog
        contentItem={assetPendingDelete}
        publicationCount={assetPendingDelete?.usageCount ?? 0}
        onConfirm={(asset) => onDeleteAsset(asset.id)}
        onClose={() => setAssetPendingDelete(null)}
      />
    </div>
  );
}

function MediaCard({
  asset: contentAsset,
  gradient,
  onThumbnailSave,
  onEdit,
  onDelete,
}: {
  asset: MediaAssetViewModel;
  gradient: string;
  onThumbnailSave: MediaLibraryProps["onThumbnailSave"];
  onEdit(): void;
  onDelete(): void;
}) {
  const { publishedLinks, sourceUrl, thumbnailUrl } = contentAsset;
  // Own UI state: the thumbnail editor, and a broken image falling back to the gradient.
  const [isEditingThumbnail, setIsEditingThumbnail] = useState(false);
  const [thumbnailDraft, setThumbnailDraft] = useState("");
  const [thumbnailError, setThumbnailError] = useState("");
  const [failedThumbnailUrl, setFailedThumbnailUrl] = useState("");
  const showsThumbnail = Boolean(thumbnailUrl) && failedThumbnailUrl !== thumbnailUrl;

  const primaryUrl = publishedLinks[0]?.url || sourceUrl;
  const primaryLinkProps = primaryUrl
    ? {
        href: primaryUrl,
        target: "_blank",
        rel: "noopener noreferrer",
        title: publishedLinks.length
          ? `Open on ${publishedLinks[0].channel}`
          : "Open in content tracker",
      }
    : null;
  const CoverElement = primaryLinkProps ? "a" : "div";

  function openThumbnailEditor() {
    setThumbnailDraft(thumbnailUrl);
    setThumbnailError("");
    setIsEditingThumbnail(true);
  }
  function saveThumbnail(nextUrl: string) {
    const error = onThumbnailSave(contentAsset.id, nextUrl);
    if (error) {
      setThumbnailError(error);
      return;
    }
    setIsEditingThumbnail(false);
  }

  return (
    <article className="media-card overflow-hidden rounded-card border border-line bg-card">
      <CoverElement
        {...primaryLinkProps}
        className={`media-cover relative block aspect-[16/10] overflow-hidden bg-gradient-to-br ${gradient} p-4 text-white ${primaryLinkProps ? "transition hover:brightness-110" : ""}`}
      >
        {showsThumbnail ? (
          <>
            {/* A plain <img>: thumbnails come from any host the team pastes. */}
            <img
              src={thumbnailUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setFailedThumbnailUrl(thumbnailUrl)}
              className="media-cover__image absolute inset-0 size-full object-cover"
            />
            {/* Keeps the title readable on light images. */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          </>
        ) : (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(135deg,transparent 35%,white 35% 36%,transparent 36% 60%,white 60% 61%,transparent 61%)",
            }}
          />
        )}
        <span className="relative text-[9px] font-bold uppercase tracking-[.16em] text-white/70">
          HANDONG E&C
        </span>
        <div className="absolute bottom-4 left-4 right-4 line-clamp-2 text-[16px] font-semibold leading-tight">
          {contentAsset.title}
        </div>
      </CoverElement>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <Tag tone="green">Approved</Tag>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted">{contentAsset.usageCount} uses</span>
            <ContentActionMenu
              contentItem={contentAsset}
              onEdit={onEdit}
              onDelete={onDelete}
              className="media-card__actions -my-1"
            />
          </div>
        </div>
        {primaryLinkProps ? (
          <a
            {...primaryLinkProps}
            className="contentAsset-title mt-2 block truncate text-[11px] font-semibold hover:text-brand-text hover:underline"
          >
            {contentAsset.title}
          </a>
        ) : (
          <div className="contentAsset-title mt-2 truncate text-[11px] font-semibold">
            {contentAsset.title}
          </div>
        )}
        <div className="mt-1 text-[9.5px] text-muted">{contentAsset.format || "Content asset"}</div>
        {(publishedLinks.length > 0 || sourceUrl) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {publishedLinks.map((publication) => (
              <a
                key={publication.id}
                href={publication.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md bg-soft px-1.5 py-0.5 text-[9px] font-semibold text-brand-text hover:bg-brand-soft"
              >
                {publication.channel} ↗
              </a>
            ))}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-1.5 py-0.5 text-[9px] text-muted hover:bg-soft hover:text-ink"
              >
                Tracker ↗
              </a>
            )}
          </div>
        )}

        {isEditingThumbnail ? (
          <form
            className="media-card__thumbnail-form mt-3 grid gap-2 border-t border-line pt-3"
            onSubmit={(formEvent) => {
              formEvent.preventDefault();
              saveThumbnail(thumbnailDraft);
            }}
          >
            <label className="grid gap-1">
              <span className="text-[10px] font-semibold text-muted">Thumbnail image URL</span>
              <Input
                type="url"
                autoFocus
                value={thumbnailDraft}
                placeholder="https://…/image.jpg"
                aria-invalid={Boolean(thumbnailError)}
                onChange={(inputEvent) => {
                  setThumbnailDraft(inputEvent.target.value);
                  setThumbnailError("");
                }}
                onKeyDown={(keyEvent) => {
                  if (keyEvent.key === "Escape") setIsEditingThumbnail(false);
                }}
                className="h-8 text-[11px]"
              />
            </label>
            {thumbnailError && (
              <span role="alert" className="text-[10px] text-danger">
                {thumbnailError}
              </span>
            )}
            <div className="flex flex-wrap gap-1.5">
              <Button type="submit" variant="primary" size="sm">
                Save
              </Button>
              {thumbnailUrl && (
                <Button type="button" size="sm" onClick={() => saveThumbnail("")}>
                  Remove
                </Button>
              )}
              <Button type="button" size="sm" onClick={() => setIsEditingThumbnail(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={openThumbnailEditor}
            className="media-card__thumbnail-button mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-muted hover:text-brand-text"
          >
            <Icon name="image" className="size-3.5" />
            {thumbnailUrl ? "Change thumbnail" : "Add thumbnail"}
          </button>
        )}
        {showsThumbnail === false && thumbnailUrl && (
          <div className="mt-1 text-[9.5px] text-danger">Thumbnail could not be loaded.</div>
        )}
      </div>
    </article>
  );
}
