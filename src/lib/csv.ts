/**
 * Escape a single field for CSV per RFC 4180:
 * wrap in double quotes and double up any embedded quotes
 * whenever the field contains a comma, quote, newline, or leading/trailing whitespace.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s === "") return "";
  if (/[",\r\n]/.test(s) || /^\s|\s$/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(","));
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\r\n");
}

/**
 * Trigger a browser download of the given CSV string.
 * Uses a BOM so Excel detects UTF-8 correctly.
 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the object URL after the download is initiated
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Format a timestamp-ish value (ISO string, unix ms string, or date string)
 * as a locale string. Returns "" for null/undefined.
 */
export function formatTimestampForCsv(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) {
    const d = new Date(Number(trimmed));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return trimmed;
}

/** Format duration_ms into "Xm Ys" for CSV. Returns "" when null/invalid. */
export function formatDurationForCsv(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) return "";
  const totalSeconds = Math.floor(value / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/** Format boolean for CSV as Yes/No or empty string when null. */
export function formatBoolForCsv(value: boolean | null | undefined): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "";
}

/** Map call_outcome value to a readable label for CSV. */
export function formatOutcomeForCsv(value: string | null | undefined): string {
  switch ((value || "").toLowerCase()) {
    case "booked":
      return "Booked";
    case "follow_up":
      return "Follow Up";
    case "info_only":
      return "Info Only";
    case "":
    case "unknown":
      return "Unknown";
    default:
      return value as string;
  }
}
