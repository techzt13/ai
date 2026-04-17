import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn classic: merge Tailwind classes conflict-aware. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
