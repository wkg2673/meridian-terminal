import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-2 text-muted",
        bull: "border-bullish/20 bg-bullish/10 text-bullish",
        bear: "border-bearish/20 bg-bearish/10 text-bearish",
        brand: "border-brand/25 bg-brand/10 text-brand",
        outline: "border-border bg-transparent text-muted",
        warning: "border-warning/25 bg-warning/10 text-warning",
        solid: "border-transparent bg-foreground text-background",
      },
      size: {
        default: "px-1.5 py-1 text-3xs",
        md: "px-2 py-1 text-2xs",
        lg: "px-2.5 py-1.5 text-xs",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };
