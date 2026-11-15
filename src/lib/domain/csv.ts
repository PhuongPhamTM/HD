import { STAGE_LABEL } from "./constants";
import type { HubData } from "./types";

const escapeCsvValue = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function createContentPlanCsv(hubData: HubData) {
  return [
    ["Title", "Campaign", "Owner", "Status", "Format", "Shoot date", "Due date"],
    ...hubData.content.map((contentItem) => [
      contentItem.title,
      hubData.campaigns.find((campaign) => campaign.id === contentItem.campaign)?.title ?? "",
      contentItem.owner,
      STAGE_LABEL[contentItem.status],
      contentItem.format,
      contentItem.shoot,
      contentItem.due,
    ]),
  ]
    .map((csvRow) => csvRow.map(escapeCsvValue).join(","))
    .join("\n");
}

export function createChannelReportCsv(hubData: HubData) {
  return [
    ["Channel", "Planned", "Posted"],
    ...Array.from(new Set(hubData.publications.map((publication) => publication.channel))).map(
      (channelName) => [
        channelName,
        hubData.publications.filter((publication) => publication.channel === channelName).length,
        hubData.publications.filter(
          (publication) => publication.channel === channelName && publication.status === "posted",
        ).length,
      ],
    ),
  ]
    .map((csvRow) => csvRow.map(escapeCsvValue).join(","))
    .join("\n");
}
