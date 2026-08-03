import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Status badge, using the Geist accent ramps.
 *
 * Colour here is information, not decoration: green reads on track, amber at
 * risk, red overdue. Each variant pairs a translucent tint with a saturated
 * border and bright text, which is how Vercel keeps status legible on black
 * without a heavy fill.
 *
 * Every badge renders its label, so state never rests on hue alone - a
 * requirement for anyone who can't distinguish these colours.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border bg-secondary text-secondary-foreground",
        outline: "border-border-strong bg-transparent text-foreground",
        overdue: "border-red-700/40 bg-red-700/15 text-red-900",
        atRisk: "border-amber-500/40 bg-amber-500/15 text-amber-900",
        onTrack: "border-green-700/40 bg-green-700/15 text-green-900",
        resolved: "border-border bg-secondary/60 text-muted-foreground",
        info: "border-blue-700/40 bg-blue-700/15 text-blue-900",
        purple: "border-purple-900/40 bg-purple-900/15 text-purple-900",
        teal: "border-teal-900/40 bg-teal-900/15 text-teal-900",
      },
      dot: { true: "", false: "" },
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

/** Dot colour per variant, for the leading indicator. */
const DOT_COLOR: Record<string, string> = {
  overdue: "bg-red-900",
  atRisk: "bg-amber-900",
  onTrack: "bg-green-900",
  resolved: "bg-gray-600",
  info: "bg-blue-900",
  purple: "bg-purple-900",
  teal: "bg-teal-900",
  default: "bg-gray-600",
  outline: "bg-gray-600",
};

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  /** Shows a leading status dot, for use in dense lists. */
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            DOT_COLOR[variant ?? "default"],
          )}
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
