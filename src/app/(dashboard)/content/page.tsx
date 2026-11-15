import { Suspense } from "react";
import { ContentPlannerContainer } from "@/features/content/ContentPlannerContainer";
export default function Page() {
  return (
    <Suspense>
      <ContentPlannerContainer />
    </Suspense>
  );
}
