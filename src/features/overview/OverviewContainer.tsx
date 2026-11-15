"use client";

import { OverviewDashboard } from "@/components/organisms/OverviewDashboard";
import { useOverviewController } from "./useOverviewController";

export function OverviewContainer() {
  const overviewProps = useOverviewController();

  return <OverviewDashboard {...overviewProps} />;
}
