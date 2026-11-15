"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";
import type { LoginFormProps } from "@/components/organisms/LoginForm";

export type LoginControllerResult = Pick<LoginFormProps, "error" | "loginAction" | "isPending">;

export function useLoginController(): LoginControllerResult {
  const [loginState, loginAction, isPending] = useActionState<LoginState, FormData>(login, {});
  return { error: loginState.error, loginAction, isPending };
}
