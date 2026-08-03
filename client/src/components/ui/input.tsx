import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input.
 *
 * Sits on the page background with a hairline border, brightening on hover and
 * taking a blue focus ring - Geist's pattern. Deliberately not a filled control:
 * a lighter fill on black reads as disabled.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm",
        "transition-[border-color,box-shadow] duration-150",
        "placeholder:text-muted-foreground/70",
        "hover:border-border-strong",
        "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "file:mr-3 file:h-7 file:cursor-pointer file:rounded file:border-0 file:bg-secondary file:px-2.5 file:text-xs file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
