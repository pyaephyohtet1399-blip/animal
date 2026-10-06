import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve conflicting Tailwind utilities.
 * Used by every UI primitive so component-level overrides always win.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}