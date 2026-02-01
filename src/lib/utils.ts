import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a price with commas as thousand separators (US format)
 * @param value - The number to format
 * @returns Formatted string with commas (e.g., 499000 -> "499,000")
 */
export function formatPrice(value: number): string {
  return value.toLocaleString('en-US')
}
