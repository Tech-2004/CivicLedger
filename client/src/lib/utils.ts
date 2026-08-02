import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names, with later Tailwind utilities beating earlier ones.
 * Standard shadcn/ui helper: clsx handles conditionals, tailwind-merge resolves
 * conflicts so a caller's `px-6` overrides a component's default `px-4`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
