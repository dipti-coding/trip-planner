// Deterministic date/time parsing, ported from the Swift _dateFormats + toISO logic
// (BookingParserModule.swift:15-61) into pure JS so it is unit-testable and runs
// before the LLM. Outputs local wall-clock time with no timezone — matching the
// frontend contract ("YYYY-MM-DDTHH:MM:SS"), or date-only ("YYYY-MM-DD") when the
// span has no time component. Missing/invalid years fall back to tripYear.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const WEEKDAY = /^\s*(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?,?\s*/i;

const pad = (n: number) => String(n).padStart(2, '0');

// Strip a leading weekday token (full or abbreviated, with or without comma), e.g.
// "Wed Mar 06, 2024" → "Mar 06, 2024", "Saturday, December 20" → "December 20".
export function stripLeadingWeekday(s: string): string {
  return s.replace(WEEKDAY, '');
}

// Drop a trailing timezone designator (Z or ±HH:MM); booking times are local
// wall-clock, and keeping an offset would shift the stored time.
function stripTimezone(s: string): string {
  if (s.endsWith('Z')) return s.slice(0, -1);
  const tail = s.slice(-6);
  if (/^[+-]\d{2}:\d{2}$/.test(tail)) return s.slice(0, -6);
  return s;
}

function to24h(hour: number, ampm: string | undefined): number {
  if (!ampm) return hour;
  const pm = /p/i.test(ampm);
  if (pm) return hour === 12 ? 12 : hour + 12;
  return hour === 12 ? 0 : hour; // 12am → 00
}

// Parse a single isolated date (or datetime) span. Returns wall-clock ISO, or
// undefined if no date could be found.
export function toISO(raw: string, tripYear: string): string | undefined {
  let s = stripTimezone(raw.trim());

  // Fast path: already ISO (with optional time). Returned verbatim (idempotent).
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    const [, y, mo, d, h, mi, se] = iso;
    if (h != null) return `${y}-${mo}-${d}T${h}:${mi}:${se ?? '00'}`;
    return `${y}-${mo}-${d}`;
  }

  // Numeric MM/dd/yyyy or MM/dd/yy.
  const numeric = s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (numeric) {
    let [, mo, d, y] = numeric;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${pad(+mo)}-${pad(+d)}`;
  }

  // Component scavenging: find month name, year, time, then day from what's left.
  const lower = s.toLowerCase();
  const monthMatch = lower.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/);
  if (!monthMatch) return undefined;
  const month = MONTHS[monthMatch[1].slice(0, 3)];

  const yearMatch = s.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : tripYear;

  const timeMatch = lower.match(/\b(\d{1,2}):(\d{2})\s*(am|pm)?/);

  // Remove the year and time substrings so the remaining 1-2 digit number is the day.
  let rest = s;
  if (yearMatch) rest = rest.replace(yearMatch[0], ' ');
  if (timeMatch) rest = rest.replace(timeMatch[0], ' ');
  const dayMatch = rest.match(/\b(\d{1,2})\b/);
  if (!dayMatch) return undefined;
  const day = +dayMatch[1];

  const date = `${year}-${pad(month)}-${pad(day)}`;
  if (!timeMatch) return date;

  const hour = to24h(+timeMatch[1], timeMatch[3]);
  return `${date}T${pad(hour)}:${timeMatch[2]}:00`;
}

// Find every parseable date/time in a block of text, in document order. Used to feed
// the LLM assignment stage a deterministic candidate list (it picks which applies to
// which leg/location rather than parsing raw dates itself).
export function findDateCandidates(text: string, tripYear: string): string[] {
  const stripped = stripLeadingWeekday(text);
  const out: string[] = [];
  // Match "<Month> <day>[, year][, time]" or "<day> <Month> <year>" spans.
  const re =
    /(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}(?:,?\s*\d{4})?(?:,?\s*(?:at\s+)?\d{1,2}:\d{2}\s*(?:am|pm)?)?|\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(stripped))) {
    const parsed = toISO(m[0], tripYear);
    if (parsed) out.push(parsed);
  }
  return out;
}
