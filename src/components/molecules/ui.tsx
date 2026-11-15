import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Avatar, ProgressBar, Tag } from "@/components/atoms/ui";
import { formatRelativeDate } from "@/lib/domain/dates";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={cn("card rounded-card border border-line bg-card", className)} {...props} />
  );
}
export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-header flex min-h-14 items-center justify-between gap-4 border-b border-line px-5 py-3">
      <div>
        <h2 className="card-header__title m-0 text-[14px] font-semibold">{title}</h2>
        {subtitle && (
          <p className="card-header__subtitle m-0 mt-0.5 text-[11px] text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card-body p-5", className)} {...props} />;
}
export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="form-field grid gap-1.5">
      <span className="form-field__label text-[11.5px] font-semibold text-muted">{label}</span>
      {children}
      {hint && <span className="form-field__hint text-[10.5px] text-faint">{hint}</span>}
    </label>
  );
}
const tileTone = {
  danger: "border-l-danger [&_.stat-tile__value]:text-danger",
  warning: "border-l-[#d79a2b] [&_.stat-tile__value]:text-warning",
  ok: "border-l-line [&_.stat-tile__value]:text-ink",
  brand: "border-l-brand [&_.stat-tile__value]:text-brand-text",
};
export function StatTile({
  label,
  value,
  cta,
  tone = "ok",
}: {
  label: string;
  value: number | string;
  cta: string;
  tone?: keyof typeof tileTone;
}) {
  return (
    <article
      className={cn(
        "stat-tile grid gap-0.5 rounded-card border border-line border-l-4 bg-card px-4 py-3.5",
        tileTone[tone],
      )}
    >
      <span className="stat-tile__label text-[11.5px] text-muted">{label}</span>
      <strong className="stat-tile__value text-[28px] font-semibold leading-tight tabular-nums">
        {value}
      </strong>
      <span className="stat-tile__link text-[11px] text-brand-text">{cta}</span>
    </article>
  );
}
export function MetricCard({
  label,
  value,
  delta,
  children,
}: {
  label: string;
  value: string | number;
  delta?: string;
  children?: ReactNode;
}) {
  return (
    <article className="metric-card rounded-card border border-line bg-card p-4">
      <div className="metric-card__label text-[11px] font-semibold uppercase tracking-[.08em] text-muted">
        {label}
      </div>
      <div className="metric-card__row mt-2 flex items-end justify-between gap-3">
        <strong className="metric-card__value text-2xl font-semibold">{value}</strong>
        {delta && <Tag tone={delta.startsWith("-") ? "red" : "green"}>{delta}</Tag>}
      </div>
      {children && <div className="metric-card__visual mt-3">{children}</div>}
    </article>
  );
}
export function PersonChip({ name }: { name: string }) {
  return (
    <span className="person-chip inline-flex items-center gap-2">
      <Avatar name={name} size="sm" />
      <span className="person-chip__name max-w-32 truncate text-[11.5px]">
        {name || "Unassigned"}
      </span>
    </span>
  );
}
export function ProgressFraction({ done, total }: { done: number; total: number }) {
  return (
    <div className="progress-fraction min-w-20">
      <div className="progress-fraction__text mb-1 flex justify-between text-[10px] text-muted">
        <span>Readiness</span>
        <b>
          {done}/{total}
        </b>
      </div>
      <ProgressBar value={total ? (done / total) * 100 : 0} />
    </div>
  );
}
export function DueLabel({ date, late = false }: { date?: string; late?: boolean }) {
  return (
    <span
      className={cn("due-label text-[11px]", late ? "font-semibold text-danger" : "text-muted")}
    >
      {date ? formatRelativeDate(date) : "No due date"}
    </span>
  );
}
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state grid min-h-40 place-items-center p-8 text-center">
      <div>
        <div className="empty-state__icon mx-auto mb-3 grid size-10 place-items-center rounded-full bg-soft text-muted">
          ◇
        </div>
        <h3 className="empty-state__title m-0 font-semibold">{title}</h3>
        <p className="empty-state__body mb-0 mt-1 text-muted">{body}</p>
      </div>
    </div>
  );
}
