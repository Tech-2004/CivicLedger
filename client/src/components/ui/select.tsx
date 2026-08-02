import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native select styled to match Input. Kept native rather than pulling in
 * Radix: these are short, non-searchable option lists, and the native control
 * gives correct mobile and keyboard behaviour for free.
 */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-input bg-secondary/40 px-3 py-1 text-sm shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Select };
