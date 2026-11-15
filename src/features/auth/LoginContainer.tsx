"use client";

import { LoginForm } from "@/components/organisms/LoginForm";
import { useLoginController } from "./useLoginController";

export function LoginContainer({
  next,
  noAccounts,
  notice,
}: {
  next: string;
  noAccounts: boolean;
  notice?: string;
}) {
  const loginProps = useLoginController();

  return <LoginForm next={next} noAccounts={noAccounts} notice={notice} {...loginProps} />;
}
