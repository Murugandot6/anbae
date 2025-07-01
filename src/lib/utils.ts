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
  if (isYesterday(date)) {
    return format(date, "'Yesterday', h:mm a"); // e.g., "Yesterday, 8:04 am" - Fixed: 'Yesterday' is now escaped
  }
  return format(date, "MMM d, yyyy, h:mm a"); // e.g., "Jun 21, 2024, 8:04 am"
}