import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * Replaces "Loading…" text, which causes a layout jump when real content
 * arrives. A skeleton reserves the eventual space, so the page settles once
 * rather than twice.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary", className)}
      {...props}
    />
  );
}

export { Skeleton };
