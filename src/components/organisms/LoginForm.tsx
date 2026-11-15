"use client";
import { Button, Checkbox, Input } from "@/components/atoms/ui";
import { FormField } from "@/components/molecules/ui";

export interface LoginFormProps {
  next: string;
  noAccounts: boolean;
  notice?: string;
  /** Error message from the last sign-in attempt. */
  error?: string;
  /** Form action that signs in. */
  loginAction(formData: FormData): void;
  isPending: boolean;
}

export function LoginForm({
  next,
  noAccounts,
  notice,
  error,
  loginAction,
  isPending: isLoginPending,
}: LoginFormProps) {
  return (
    <form
      action={loginAction}
      className="login-form rounded-card border border-line bg-card p-8 shadow-[0_18px_60px_rgba(22,36,61,.08)]"
    >
      <input type="hidden" name="next" value={next} />
      <div className="login-form__eyebrow text-[10px] font-bold uppercase tracking-[.18em] text-brand-text">
        Secure workspace
      </div>
      <h2 className="login-form__title mb-1 mt-2 text-2xl font-semibold tracking-[-.025em]">
        Welcome back
      </h2>
      <p className="login-form__intro mb-6 mt-0 text-muted">
        Sign in to continue to the content workspace.
      </p>
      {notice && (
        <p
          role="status"
          className="login-form__notice -mt-2 mb-5 rounded-ctl bg-warning-soft p-3 text-[11px] text-warning"
        >
          {notice}
        </p>
      )}
      <div className="grid gap-4">
        <FormField label="Email">
          <Input name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Password">
          <Input name="password" type="password" autoComplete="current-password" required />
        </FormField>
        <div className="flex items-center justify-between">
          <Checkbox name="remember" label="Remember me" defaultChecked />
          <span className="text-[11px] text-faint">7-day session</span>
        </div>
        {error && (
          <div
            role="alert"
            className="login-form__error rounded-ctl border border-danger/20 bg-danger-soft px-3 py-2 text-danger"
          >
            {error}
          </div>
        )}
        <Button
          type="submit"
          variant="primary"
          className="login-form__submit w-full"
          disabled={isLoginPending}
        >
          {isLoginPending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
      {noAccounts && (
        <p className="login-form__setup mb-0 mt-5 rounded-ctl bg-soft p-3 text-[11px] text-muted">
          No accounts are set up yet. Add an admin to <code>HUB_USERS</code> in the server
          environment and restart the app.
        </p>
      )}
    </form>
  );
}
