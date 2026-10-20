import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "emerald"
    | "amber"
    | "purple"
    | "rose"
    | "teal";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-primary/20 text-primary border-primary/30",
    secondary: "bg-secondary text-secondary-foreground border-border",
    destructive: "bg-destructive/20 text-destructive border-destructive/30",
    outline: "text-foreground border-border",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    rose: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    teal: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
