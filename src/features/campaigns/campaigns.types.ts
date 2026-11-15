export interface CampaignViewModel {
  id: string;
  title: string;
  goal: string;
  owner: string;
  contentCount: number;
  completedContentCount: number;
  publicationCount: number;
  completionPercentage: number;
}

export interface CampaignListProps {
  campaigns: CampaignViewModel[];
  /** Receives the "New campaign" form (title, owner, goal, start, end). */
  onCreateCampaign(formData: FormData): void;
}
