import { LoginContainer } from "@/features/auth/LoginContainer";
import { hasNoAccounts } from "@/lib/auth/users";

const NOTICES: Record<string, string> = {
  inactive: "Your account was changed or deactivated. Sign in again.",
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const p = await searchParams;
  return (
    <LoginContainer
      next={p.next || "/"}
      noAccounts={await hasNoAccounts()}
      notice={p.reason ? NOTICES[p.reason] : undefined}
    />
  );
}
