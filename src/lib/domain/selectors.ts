import { formatVietnamDateKey, parseVietnamDate } from "./dates";
import { activeOptions, DEFAULT_OPTIONS, type OptionItem, type PhaseOption } from "./options";
import type { ContentItem, HubData, Publication } from "./types";

export const isContentOverdue = (contentItem: ContentItem, now = new Date()) =>
  Boolean(
    contentItem.due &&
    contentItem.due < formatVietnamDateKey(now) &&
    !["approved", "published", "cancelled", "paused"].includes(contentItem.status),
  );
export const isContentWaitingForReview = (contentItem: ContentItem) =>
  contentItem.status === "in_review";
export const isPublicationLate = (publication: Publication, now = new Date()) =>
  !["posted", "cancelled"].includes(publication.status) &&
  Boolean(
    parseVietnamDate(publication.date) &&
    parseVietnamDate(publication.date)!.getTime() < now.getTime(),
  );
/** Readiness counts only the active checks, so retired checks drop out of the total. */
export function getContentReadiness(
  contentItem: ContentItem,
  checks: OptionItem[] = DEFAULT_OPTIONS.checks,
) {
  const activeCheckKeys = new Set(activeOptions(checks).map((check) => check.key));
  return {
    done: (contentItem.checks ?? []).filter((checkKey) => activeCheckKeys.has(checkKey)).length,
    total: activeCheckKeys.size,
  };
}
export const getContentPhaseKey = (
  contentItem: ContentItem,
  phases: PhaseOption[] = DEFAULT_OPTIONS.phases,
) => phases.find((phase) => phase.statuses.includes(contentItem.status))?.key ?? contentItem.status;
export const selectPublicationsForContent = (hubData: HubData, contentId: string) =>
  hubData.publications.filter((publication) => publication.content === contentId);
export function selectHubStatistics(hubData: HubData, campaignId = "") {
  const activeContentItems = hubData.content.filter(
    (contentItem) =>
      (!campaignId || contentItem.campaign === campaignId) && contentItem.status !== "cancelled",
  );
  const activeContentIds = new Set(activeContentItems.map((contentItem) => contentItem.id));
  const activePublications = hubData.publications.filter(
    (publication) =>
      (!campaignId || activeContentIds.has(publication.content)) &&
      publication.status !== "cancelled",
  );
  return {
    contentItems: activeContentItems,
    publications: activePublications,
    completedContentCount: activeContentItems.filter((contentItem) =>
      ["approved", "published"].includes(contentItem.status),
    ).length,
    postedPublicationCount: activePublications.filter(
      (publication) => publication.status === "posted",
    ).length,
    overdueContentCount: activeContentItems.filter((contentItem) => isContentOverdue(contentItem))
      .length,
    reviewQueueCount: activeContentItems.filter((contentItem) =>
      isContentWaitingForReview(contentItem),
    ).length,
  };
}
