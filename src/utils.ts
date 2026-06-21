import { format, parseISO } from "date-fns";

export function safeFormatDate(dateStr?: string, formatStr = "dd/MM/yyyy", fallback = "-"): string {
  if (!dateStr) return fallback;
  try {
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) return dateStr;
    return format(parsed, formatStr);
  } catch (e) {
    console.error("Error formatting date:", dateStr, e);
    return dateStr || fallback;
  }
}

export function safeParseISO(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const parsed = parseISO(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function normalizeString(str?: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
