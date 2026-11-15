"use client";

import { CampaignList } from "@/components/organisms/CampaignList";
import { useCampaignsController } from "./useCampaignsController";

export function CampaignsContainer() {
  const campaignsProps = useCampaignsController();

  return <CampaignList {...campaignsProps} />;
}
