import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * SLA / status badge.
 *
 * Ranked by visual weight rather than hue, so urgency still reads at a glance
 * without colour: `overdue` inverts to a light fill, `atRisk` is a raised
 * outline, `onTrack` is quiet, `resolved` recedes furthest. Every badge renders
 * its label, so state is never conveyed by styling alone.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border bg-secondary text-secondary-foreground",
        overdue: "border-primary bg-primary text-primary-foreground",
        atRisk: "border-border bg-accent text-accent-foreground",
        onTrack: "border-border bg-secondary/60 text-muted-foreground",
        resolved: "border-border bg-transparent text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/** Maps the shared SlaBadge union onto a badge variant. */
export const slaBadgeVariant = {
  overdue: "overdue",
  at_risk: "atRisk",
  on_track: "onTrack",
  resolved: "resolved",
} as const;

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
