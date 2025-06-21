import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "MMM d, yyyy"); // e.g., "Jun 21, 2024"
}

export function formatDateTimeForMessageView(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return format(date, "h:mm a"); // e.g., "8:04 am"
  }
  // Using 'dd/MM/yyyy, HH:mm:ss' format as seen in your screenshot
  return format(date, "dd/MM/yyyy, HH:mm:ss"); // e.g., "21/06/2025, 00:47:06"
}