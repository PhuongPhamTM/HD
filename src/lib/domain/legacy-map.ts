import { LEGACY_CHECK_KEYS } from "./options";
import type { HubData, ContentStatus, PublicationStatus } from "./types";

const contentMap: Record<string, ContentStatus> = {
  "Ý tưởng": "idea",
  "Đang viết": "writing",
  "Sẵn sàng quay": "ready_to_shoot",
  "Đã quay": "shot",
  "Đang dựng": "editing",
  "Cần chỉnh sửa": "needs_changes",
  "Chờ duyệt": "in_review",
  "Đã duyệt": "approved",
  "Đã xuất bản": "published",
  "Tạm dừng": "paused",
  Hủy: "cancelled",
};
const pubMap: Record<string, PublicationStatus> = {
  "Dự kiến": "planned",
  "Đã lên lịch": "scheduled",
  "Đã đăng": "posted",
  "Đăng lỗi": "failed",
  Hủy: "cancelled",
};
const contentKeys = new Set<ContentStatus>([
  "idea",
  "writing",
  "ready_to_shoot",
  "shot",
  "editing",
  "needs_changes",
  "in_review",
  "approved",
  "published",
  "paused",
  "cancelled",
]);
const publicationKeys = new Set<PublicationStatus>([
  "planned",
  "scheduled",
  "posted",
  "failed",
  "cancelled",
]);
export const mapContentStatus = (value: string): ContentStatus =>
  contentMap[value] ??
  (contentKeys.has(value as ContentStatus) ? (value as ContentStatus) : "idea");
export const mapPublicationStatus = (value: string): PublicationStatus =>
  pubMap[value] ??
  (publicationKeys.has(value as PublicationStatus) ? (value as PublicationStatus) : "planned");
/**
 * Checks used to be a positional `boolean[]`; they are now the keys of completed checks,
 * so removing a check option no longer shifts every other check.
 */
export function normalizeChecks(checks: unknown): string[] {
  if (!Array.isArray(checks)) return [];
  return checks.flatMap((check, checkIndex) => {
    if (typeof check === "string") return check ? [check] : [];
    return check === true && LEGACY_CHECK_KEYS[checkIndex] ? [LEGACY_CHECK_KEYS[checkIndex]] : [];
  });
}
export function normalizeLegacyData(input: HubData): HubData {
  return {
    ...input,
    campaigns: input.campaigns ?? [],
    media: input.media ?? [],
    activity: input.activity ?? [],
    content: (input.content ?? []).map((c) => ({
      ...c,
      status: mapContentStatus(c.status),
      checks: normalizeChecks(c.checks),
    })),
    publications: (input.publications ?? []).map((p) => ({
      ...p,
      status: mapPublicationStatus(p.status),
    })),
  };
}
