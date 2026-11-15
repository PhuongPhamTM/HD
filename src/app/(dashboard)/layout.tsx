import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DashboardShellContainer } from "@/features/shell/DashboardShellContainer";
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/logout?reason=inactive");
  return <DashboardShellContainer user={user}>{children}</DashboardShellContainer>;
}
