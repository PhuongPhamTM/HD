import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const buttonVariants = {
  primary: "bg-brand text-white border-brand hover:bg-accent",
  secondary: "bg-card text-ink border-line hover:bg-soft",
  ghost: "bg-transparent text-muted border-transparent hover:bg-soft hover:text-ink",
  danger: "bg-danger-soft text-danger border-danger/20",
};
export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: "sm" | "md";
}) {
  return (
    <button
      className={cn(
        "button inline-flex items-center justify-center gap-2 rounded-ctl border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        size === "sm" ? "h-8 px-3 text-[12px]" : "h-9 px-4",
        className,
      )}
      {...props}
    />
  );
}
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "input h-9 w-full rounded-ctl border border-line bg-card px-3 text-ink placeholder:text-faint",
        className,
      )}
      {...props}
    />
  );
}
export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("select h-9 rounded-ctl border border-line bg-card px-3 text-ink", className)}
      {...props}
    >
      {children}
    </select>
  );
}
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "textarea min-h-24 w-full rounded-ctl border border-line bg-card p-3 text-ink placeholder:text-faint",
        className,
      )}
      {...props}
    />
  );
}
const tagTones = {
  blue: "bg-brand-soft text-brand-text",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  red: "bg-danger-soft text-danger",
  violet: "bg-violet-soft text-violet",
  gray: "bg-soft text-muted",
};
export function Tag({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tagTones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tag inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        tagTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const palette = ["#123985", "#6a4bb0", "#1c7c5f", "#b56b25", "#a13d68"];
  const color = palette[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % palette.length];
  return (
    <span
      title={name}
      className={cn(
        "avatar inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        size === "sm" ? "size-6 text-[9px]" : "size-8 text-[11px]",
      )}
      style={{ background: color }}
    >
      {name
        .split(/[ ,]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((x) => x[0]?.toUpperCase())
        .join("") || "?"}
    </span>
  );
}
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("progress-bar block h-1.5 overflow-hidden rounded-full bg-soft", className)}
    >
      <span
        className="progress-bar__fill block h-full rounded-full bg-accent"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}
export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span
      className={cn(
        "brand-mark inline-grid size-9 place-items-center rounded-[10px] text-lg font-black",
        inverse ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-brand text-white",
      )}
    >
      H
    </span>
  );
}
export function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span className="count-badge min-w-5 rounded-full bg-soft px-1.5 py-0.5 text-center text-[10px] font-semibold text-muted">
      {children}
    </span>
  );
}
export function Checkbox({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="checkbox inline-flex items-center gap-2 text-muted">
      <input type="checkbox" className="checkbox__input size-4 accent-brand" {...props} />
      <span>{label}</span>
    </label>
  );
}
