export type ContentStatus =
  | "idea"
  | "writing"
  | "ready_to_shoot"
  | "shot"
  | "editing"
  | "needs_changes"
  | "in_review"
  | "approved"
  | "published"
  | "paused"
  | "cancelled";
export type PublicationStatus = "planned" | "scheduled" | "posted" | "failed" | "cancelled";

export interface Campaign {
  id: string;
  title: string;
  owner: string;
  goal: string;
  start?: string;
  end?: string;
  source?: string;
  sourceCampaign?: string;
}
export interface ContentItem {
  id: string;
  title: string;
  campaign: string;
  owner: string;
  location: string;
  status: ContentStatus;
  shoot: string;
  /** Shoot start time, "HH:mm" (24h). Empty when not scheduled to a time. */
  shootTime?: string;
  edit: string;
  due: string;
  script: string;
  format: string;
  priority: string;
  pillar: string;
  /** Keys of the completed checklist items (see the "check" group in the Options tab). */
  checks: string[];
  /** Cover image URL shown on the Asset Library card (http/https), or empty. */
  thumbnail?: string;
  createdAt?: string;
  approvedAt?: string;
  historyOnly?: boolean;
  [key: string]: unknown;
}
export interface Media {
  id: string;
  title: string;
  content?: string;
  type?: string;
  url?: string;
  approval?: "in_review" | "approved";
  createdAt?: string;
  [key: string]: unknown;
}
export interface Publication {
  id: string;
  content: string;
  channel: string;
  account: string;
  date: string;
  /** Publish time, "HH:mm" (24h). Empty when not scheduled to a time. */
  time?: string;
  posted: string;
  status: PublicationStatus;
  url: string;
  caption: string;
  hashtags: string;
  scheduleUnknown?: boolean;
  [key: string]: unknown;
}
export interface Activity {
  id: string;
  message: string;
  at: string;
  actor?: string;
}
export interface HubData {
  version?: number;
  demo?: boolean;
  campaigns: Campaign[];
  content: ContentItem[];
  media: Media[];
  publications: Publication[];
  activity: Activity[];
}
