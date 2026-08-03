"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption {
  value: string;
  label: string;
}

/**
 * Segmented control.
 *
 * One row of equal-width segments inside a single inset track, which is how a set
 * of mutually exclusive choices should read. The previous treatment - loose pills
 * that wrapped onto a second line - made three related filters look like a pile
 * of unrelated buttons, and the wrap point moved as labels changed.
 *
 * Selection is the raised segment, so no check icon is needed; dropping it also
 * stops the label shifting sideways when a segment is picked.
 *
 * `radiogroup` semantics rather than buttons: exactly one value is always
 * selected, which is what a screen reader should be told.
 */
export function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        // Scrolls rather than wraps when the labels can't fit, so the control
        // stays one row at any width.
        "flex w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-secondary/30 p-1",
        className,
      )}
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value || "all"}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150",
              selected
                ? "bg-background font-medium text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
