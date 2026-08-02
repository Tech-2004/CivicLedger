import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-secondary/40 px-3 py-1 text-sm shadow-sm transition-colors",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-xs file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
