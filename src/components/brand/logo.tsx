import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-brand text-white shadow-[0_2px_10px_-2px_hsl(var(--brand)/0.65)]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
        <path
          d="M5.5 16.5V11M5.5 8.5v1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 17V7.5M12 20v-1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M18.5 16v-4.5M18.5 9v1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none"
      aria-label="Meridian Terminal home"
    >
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">Meridian</span>
          <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-subtle">
            Terminal
          </span>
        </span>
      )}
    </Link>
  );
}
