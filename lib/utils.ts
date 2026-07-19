import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime12h(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// Format a pickup window like "7:00 AM - 8:00 AM". Falls back to the single
// start time when no end time is set.
export function formatTimeWindow(start: string, end?: string | null) {
  if (!end) return formatTime12h(start);
  return `${formatTime12h(start)} - ${formatTime12h(end)}`;
}

// Normalize a date to midnight in India timezone (used for trip dates).
export function toDateOnly(input: string | Date): Date {
  const source = typeof input === "string" ? new Date(input) : input;
  // Get the date in India timezone (YYYY-MM-DD format)
  const indiaDateStr = getIndiaDateString(source);
  // Create a UTC Date from that string and adjust back to represent the India timezone midnight
  const [year, month, day] = indiaDateStr.split("-").map(Number);
  const indiaOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) + indiaOffsetMs);
}

export function getIndiaDateString(date: Date | string = new Date()): string {
  const source = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(source);
}

// Format a date as YYYY-MM-DD using local components (avoids UTC off-by-one).
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
