import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="label-caps mb-1.5">{eyebrow}</p>}
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "up" | "down" | "muted";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="label-caps">{label}</p>
      <p
        className={cn(
          "tnum mt-1.5 text-[15px] font-semibold tracking-tight",
          tone === "up" && "text-bullish",
          tone === "down" && "text-bearish",
          tone === "muted" && "text-muted",
          tone === "default" && "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-2xs text-subtle">{hint}</p>}
    </div>
  );
}
