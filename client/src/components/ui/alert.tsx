import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * `emergency` is deliberately the only coloured variant in the system. Colour is
 * a life-safety affordance on the emergency path, and it is always paired with
 * text, so the meaning does not rest on colour perception.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        emergency:
          "border-destructive bg-destructive/15 text-destructive-foreground font-medium",
        notice: "border-border bg-secondary/50 text-foreground",
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
