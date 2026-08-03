import { cn } from "@/lib/utils";

/**
 * Wordmark.
 *
 * The glyph is a filled square with a cut ledger line - simple enough to hold up
 * at 20px, where the previous outlined building icon turned to mush.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="20" height="20" rx="5" className="fill-foreground" />
        <path
          d="M5.5 13.5V8.5M10 13.5V5.5M14.5 13.5v-3"
          stroke="var(--background)"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {showWordmark && (
        <span className="truncate text-[15px] font-semibold tracking-tight">
          CivicLedger
        </span>
      )}
    </span>
  );
}
