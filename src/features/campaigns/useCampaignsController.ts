"use client";

import { useHubStore } from "@/lib/store/useHubStore";
import type { CampaignListProps } from "./campaigns.types";

export function useCampaignsController(): CampaignListProps {
  const campaigns = useHubStore((state) => state.campaigns);
  const contentItems = useHubStore((state) => state.content);
  const publications = useHubStore((state) => state.publications);
  const addCampaign = useHubStore((state) => state.addCampaign);

  function createCampaign(formData: FormData) {
    addCampaign({
      id: crypto.randomUUID(),
      title: String(formData.get("title")),
      owner: String(formData.get("owner")),
      goal: String(formData.get("goal")),
      start: String(formData.get("start")),
      end: String(formData.get("end")),
    });
  }

  return {
    campaigns: campaigns.map((campaign) => {
      const campaignContentItems = contentItems.filter(
        (contentItem) => contentItem.campaign === campaign.id,
      );
      const completedContentCount = campaignContentItems.filter((contentItem) =>
        ["approved", "published"].includes(contentItem.status),
      ).length;
      const campaignPublications = publications.filter((publication) =>
        campaignContentItems.some((contentItem) => contentItem.id === publication.content),
      );
      return {
        id: campaign.id,
        title: campaign.title,
        goal: campaign.goal,
        owner: campaign.owner,
        contentCount: campaignContentItems.length,
        completedContentCount,
        publicationCount: campaignPublications.length,
        completionPercentage: campaignContentItems.length
          ? Math.round((completedContentCount / campaignContentItems.length) * 100)
          : 0,
      };
    }),
    onCreateCampaign: createCampaign,
  };
}
