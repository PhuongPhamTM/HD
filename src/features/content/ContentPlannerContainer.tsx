"use client";

import { ContentPlanner } from "@/components/organisms/ContentPlanner";
import { useContentPlannerController } from "./useContentPlannerController";

export function ContentPlannerContainer() {
  const contentPlannerProps = useContentPlannerController();

  return <ContentPlanner {...contentPlannerProps} />;
}
