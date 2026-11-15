"use client";

import { useHubStore } from "@/lib/store/useHubStore";
import type { CampaignListProps } from "./campaigns.types";

export function useCampaignsController(): CampaignListProps {
  const campaigns = useHubStore((state) => state.campaigns);
  const contentItems = useHubStore((state) => state.content);
  const publications = useHubStore((state) => state.publications);
  const addCampaign = useHubStore((state) => state.addCampaign);
  const updateCampaign = useHubStore((state) => state.updateCampaign);
  const removeCampaign = useHubStore((state) => state.removeCampaign);

  function readCampaignForm(formData: FormData) {
    return {
      title: String(formData.get("title") ?? ""),
      owner: String(formData.get("owner") ?? ""),
      goal: String(formData.get("goal") ?? ""),
      start: String(formData.get("start") ?? ""),
      end: String(formData.get("end") ?? ""),
    };
  }

  function createCampaign(formData: FormData) {
    addCampaign({ id: crypto.randomUUID(), ...readCampaignForm(formData) });
  }

  function editCampaign(campaignId: string, formData: FormData) {
    updateCampaign(campaignId, readCampaignForm(formData));
  }

  function deleteCampaign(campaignId: string) {
    const campaign = campaigns.find((candidate) => candidate.id === campaignId);
    if (!campaign) return;
    const linkedCount = contentItems.filter((item) => item.campaign === campaignId).length;
    const message = linkedCount
      ? `Delete campaign “${campaign.title}”? Its ${linkedCount} content item(s) will be kept but no longer linked to a campaign.`
      : `Delete campaign “${campaign.title}”?`;
    if (!window.confirm(message)) return;
    removeCampaign(campaignId);
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
        start: campaign.start ?? "",
        end: campaign.end ?? "",
        contentCount: campaignContentItems.length,
        completedContentCount,
        publicationCount: campaignPublications.length,
        completionPercentage: campaignContentItems.length
          ? Math.round((completedContentCount / campaignContentItems.length) * 100)
          : 0,
      };
    }),
    onCreateCampaign: createCampaign,
    onUpdateCampaign: editCampaign,
    onDeleteCampaign: removeCampaign,
  };
}
