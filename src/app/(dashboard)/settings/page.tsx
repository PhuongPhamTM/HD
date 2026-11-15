import { SettingsContainer } from "@/features/settings/SettingsContainer";
import { getCurrentUser } from "@/lib/auth/current-user";
export default async function Page() {
  const user = await getCurrentUser();
  return <SettingsContainer isAdmin={user?.role === "admin"} />;
}
