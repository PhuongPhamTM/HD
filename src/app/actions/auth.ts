"use server";
import { redirect } from "next/navigation";
import { authenticate } from "@/lib/auth/users";
import { clearSession, setSession } from "@/lib/auth/session";

export type LoginState = { error?: string };
export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  let user;
  try {
    user = await authenticate(email, password);
  } catch {
    return { error: "Could not reach the user list in Google Sheets. Try again in a moment." };
  }
  if (!user) return { error: "Email or password is incorrect." };
  await setSession(user, formData.get("remember") === "on");
  const next = String(formData.get("next") || "/");
  const isSafeRedirect =
    next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/logout");
  redirect(isSafeRedirect ? next : "/");
}
export async function logout() {
  await clearSession();
  redirect("/login");
}
