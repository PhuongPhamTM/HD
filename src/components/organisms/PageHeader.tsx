import type { ReactNode } from "react";
export function PageHeader({
  eyebrow = "CONTENT OPERATIONS",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header mb-5 flex items-end justify-between gap-6">
      <div>
        <div className="page-header__eyebrow mb-1 text-[9px] font-bold uppercase tracking-[.16em] text-brand-text">
          {eyebrow}
        </div>
        <h1 className="page-header__title m-0 text-[25px] font-semibold tracking-[-.025em]">
          {title}
        </h1>
        <p className="page-header__description mb-0 mt-1 max-w-2xl text-[12px] text-muted">
          {description}
        </p>
      </div>
      {actions && (
        <div className="page-header__actions flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
