export interface CampaignViewModel {
  id: string;
  title: string;
  goal: string;
  owner: string;
  start: string;
  end: string;
  contentCount: number;
  completedContentCount: number;
  publicationCount: number;
  completionPercentage: number;
}

export interface CampaignListProps {
  campaigns: CampaignViewModel[];
  /** Receives the "New campaign" form (title, owner, goal, start, end). */
  onCreateCampaign(formData: FormData): void;
  /** Receives the edit form (same fields as create) for an existing campaign. */
  onUpdateCampaign(campaignId: string, formData: FormData): void;
  /** Deletes the campaign; its content is unlinked, not deleted. Confirmation happens in the UI. */
  onDeleteCampaign(campaignId: string): void;
}
