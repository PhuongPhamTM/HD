"use client";

import { ReportsDashboard } from "@/components/organisms/ReportsDashboard";
import { useReportsController } from "./useReportsController";

export function ReportsContainer() {
  const reportsProps = useReportsController();

  return <ReportsDashboard {...reportsProps} />;
}
