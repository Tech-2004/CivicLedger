import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Alert, using the Geist ramps.
 *
 * Each variant is a translucent tint over a saturated border, so it reads as a
 * distinct surface on black without shouting. `emergency` is the strongest and is
 * reserved for the life-safety path, where colour is a genuine affordance - and
 * it always carries text, so the meaning never rests on hue.
 */
const alertVariants = cva(
  "relative flex w-full gap-3 rounded-lg border px-4 py-3 text-sm [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        notice: "border-border bg-secondary/60 text-foreground",
        info: "border-blue-700/40 bg-blue-700/10 text-blue-900",
        success: "border-green-700/40 bg-green-700/10 text-green-900",
        warning: "border-amber-500/40 bg-amber-500/10 text-amber-900",
        emergency:
          "border-red-700/50 bg-red-700/15 font-medium text-red-900",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, alertVariants };
