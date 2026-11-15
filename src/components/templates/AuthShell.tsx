import type { ReactNode } from "react";
import { BrandMark } from "@/components/atoms/ui";
import { ThemeToggle } from "@/components/organisms/ThemeToggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell relative grid min-h-screen grid-cols-[minmax(320px,42%)_1fr] max-[760px]:grid-cols-1 max-[760px]:grid-rows-[190px_1fr]">
      <section className="auth-shell__brand-panel relative flex overflow-hidden bg-[linear-gradient(130deg,#123985,#3a6aa8)] p-14 text-white max-[760px]:p-7">
        <div
          className="auth-shell__pattern absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%,white 0 1px,transparent 1px),radial-gradient(circle at 70% 60%,white 0 1px,transparent 1px)",
            backgroundSize: "32px 32px,44px 44px",
          }}
        />
        <div className="auth-shell__brand relative z-10 my-auto max-w-sm">
          <BrandMark inverse />
          <div className="mt-5 text-[11px] font-bold tracking-[.22em] text-white/70">HANDONG</div>
          <h1 className="mt-1 text-4xl font-semibold tracking-[-.04em] max-[760px]:text-3xl">
            Content Hub
          </h1>
          <p className="mt-4 text-[14px] leading-6 text-white/75 max-[760px]:hidden">
            One calm workspace for every idea, production milestone, approval and publication.
          </p>
        </div>
      </section>
      <section className="auth-shell__form-panel grid place-items-center bg-bg p-8">
        <div className="w-full max-w-[390px]">{children}</div>
      </section>
      <div className="auth-shell__theme absolute right-5 top-5">
        <ThemeToggle />
      </div>
    </main>
  );
}
