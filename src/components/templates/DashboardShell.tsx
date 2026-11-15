"use client";
import { useState } from "react";
import { Sidebar, type SidebarProps } from "@/components/organisms/Sidebar";
import { Topbar, type TopbarProps } from "@/components/organisms/Topbar";
import { cn } from "@/lib/cn";

export interface DashboardShellProps {
  children: React.ReactNode;
  /** Sidebar props; the shell wires `onClose` to its own navigation state. */
  sidebar: Omit<SidebarProps, "onClose">;
  /** Top bar props; the shell wires `onOpenNav` to its own navigation state. */
  topbar: Omit<TopbarProps, "onOpenNav">;
  /** App-wide overlays (dialogs) rendered at the end of the shell. */
  overlays?: React.ReactNode;
}

export function DashboardShell({ children, sidebar, topbar, overlays }: DashboardShellProps) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  return (
    <div
      className={cn(
        "dashboard-shell min-h-screen",
        isNavigationOpen && "dashboard-shell--nav-open",
      )}
    >
      <Sidebar {...sidebar} onClose={() => setIsNavigationOpen(false)} />
      {isNavigationOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={() => setIsNavigationOpen(false)}
          className="fixed inset-0 z-50 hidden bg-[#08101d]/45 max-[760px]:block"
        />
      )}
      <div className="dashboard-shell__main ml-[236px] min-h-screen transition-[margin]">
        <Topbar {...topbar} onOpenNav={() => setIsNavigationOpen(true)} />
        <main className="dashboard-shell__content mx-auto max-w-[1500px] p-7 pb-14">
          {children}
        </main>
      </div>
      {overlays}
    </div>
  );
}
