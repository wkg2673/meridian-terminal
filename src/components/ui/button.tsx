"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand text-white shadow-sm hover:bg-brand/90",
        secondary:
          "border border-border bg-surface-2 text-foreground hover:border-border-strong hover:bg-elevated",
        outline:
          "border border-border bg-transparent text-foreground hover:border-border-strong hover:bg-foreground/[0.04]",
        ghost: "text-muted hover:bg-foreground/[0.055] hover:text-foreground",
        subtle: "bg-foreground/[0.055] text-foreground hover:bg-foreground/[0.085]",
        danger: "border border-bearish/25 bg-bearish/10 text-bearish hover:bg-bearish/15",
        "danger-ghost": "text-muted hover:bg-bearish/10 hover:text-bearish",
        link: "text-brand underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-3 text-xs",
        xs: "h-7 rounded-md px-2.5 text-2xs",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8 rounded-md",
        "icon-xs": "h-7 w-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
