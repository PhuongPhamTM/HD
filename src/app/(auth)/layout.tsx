import { AuthShell } from "@/components/templates/AuthShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
