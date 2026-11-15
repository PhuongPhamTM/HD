import type { ContentStatus, PublicationStatus } from "./types";

export const STAGES: { key: ContentStatus; label: string }[] = [
  { key: "idea", label: "Idea" },
  { key: "writing", label: "Writing" },
  { key: "ready_to_shoot", label: "Ready to shoot" },
  { key: "shot", label: "Shot" },
  { key: "editing", label: "Editing" },
  { key: "needs_changes", label: "Needs changes" },
  { key: "in_review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "paused", label: "Paused" },
  { key: "cancelled", label: "Cancelled" },
];
export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.key, s.label])) as Record<
  ContentStatus,
  string
>;
export const PHASES: { key: string; label: string; statuses: ContentStatus[] }[] = [
  { key: "idea", label: "Idea", statuses: ["idea"] },
  { key: "script", label: "Script", statuses: ["writing"] },
  { key: "shoot", label: "Shoot", statuses: ["ready_to_shoot"] },
  { key: "edit", label: "Edit", statuses: ["shot", "editing", "needs_changes"] },
  { key: "review", label: "Review", statuses: ["in_review"] },
  { key: "publish", label: "Publish", statuses: ["approved", "published"] },
];
export const CHANNELS = ["Facebook", "TikTok", "YouTube", "LinkedIn", "Website"];
export const PUB_STATES: { key: PublicationStatus; label: string }[] = [
  { key: "planned", label: "Planned" },
  { key: "scheduled", label: "Scheduled" },
  { key: "posted", label: "Posted" },
  { key: "failed", label: "Failed" },
  { key: "cancelled", label: "Cancelled" },
];
export const PUB_LABEL = Object.fromEntries(PUB_STATES.map((s) => [s.key, s.label])) as Record<
  PublicationStatus,
  string
>;
export const CHECK_NAMES = [
  "Script locked",
  "Shot",
  "Edit approved",
  "Cover ready",
  "Caption locked",
  "Scheduled",
];
export const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: "grid" },
  { href: "/content", label: "Content Plan", icon: "list" },
  { href: "/production", label: "Production & Review", icon: "play" },
  { href: "/campaigns", label: "Campaigns", icon: "flag" },
  { href: "/media", label: "Asset Library", icon: "image" },
  { href: "/calendar", label: "Shoot & Publish Calendar", icon: "calendar" },
  { href: "/reports", label: "Reports", icon: "chart" },
  { href: "/settings", label: "Settings & Integrations", icon: "settings" },
];
