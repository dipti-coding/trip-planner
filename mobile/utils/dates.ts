const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function fmtShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtDow(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function fmtDayLabel(iso: string): string {
  return DAYS[new Date(iso + 'T00:00:00').getDay()];
}

export function fmtDayNum(iso: string): number {
  return new Date(iso + 'T00:00:00').getDate();
}

export function fmtTime(iso: string | null): string {
  if (!iso) return '';
  // Slice to 19 chars ("YYYY-MM-DDTHH:MM:SS") to strip any UTC offset/Z suffix.
  // Stored datetimes are wall-clock local time; we never want UTC conversion here.
  const d = new Date(iso.slice(0, 19));
  return d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true});
}

export function fmtDuration(start: string | null, end: string | null): string {
  if (!start || !end) return '';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function dayCount(start: string, end: string): number {
  const a = new Date(start + 'T00:00:00');
  const b = new Date(end + 'T00:00:00');
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const e = new Date(end + 'T00:00:00');
  for (const d = new Date(start + 'T00:00:00'); d <= e; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function tripStatus(start: string, end: string): 'current' | 'future' | 'past' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (today >= s && today <= e) return 'current';
  if (today < s) return 'future';
  return 'past';
}
