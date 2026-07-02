import {NativeModules} from 'react-native';
import {PLAN_DETAIL_VALID_KEYS, PLAN_DETAIL_KEY_ALIASES} from './detailSchema';

const {BookingParserModule} = NativeModules;

export const MAX_OCR_CHARS = 3000;

export type {ParsedPlan} from './core/types';

export function truncate(text: string): string {
  return text.length > MAX_OCR_CHARS ? text.slice(0, MAX_OCR_CHARS) : text;
}

// Remove day-of-week prefixes (e.g. "Sat, Aug 31" → "Aug 31") so the model
// cannot reconcile them against the year and shift the day-of-month.
export function stripDayOfWeek(text: string): string {
  return text.replace(/\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/gi, '');
}

export function extractJSON(raw: string): any {
  const arrS = raw.indexOf('['), arrE = raw.lastIndexOf(']');
  if (arrS !== -1 && arrE !== -1) {
    try { return JSON.parse(raw.slice(arrS, arrE + 1)); } catch {}
  }
  const objS = raw.indexOf('{'), objE = raw.lastIndexOf('}');
  if (objS !== -1 && objE !== -1) {
    try { return JSON.parse(raw.slice(objS, objE + 1)); } catch {}
  }
  return null;
}

export function str(v: any): string | undefined {
  if (v == null || v === 'null' || v === '') return undefined;
  return String(v);
}

export const PROMPT_RETRY_COUNT = 1;

export async function runPrompt(systemPrompt: string, userPrompt: string, retries = PROMPT_RETRY_COUNT): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await BookingParserModule.runPrompt(userPrompt, systemPrompt);
    } catch (err) {
      lastError = err;
      console.log(`[BookingParser] attempt ${attempt + 1}/${retries + 1} failed:`, (err as any)?.message);
    }
  }
  throw lastError;
}

export async function runGenericParser(textWithContext: string): Promise<any[]> {
  const result = await BookingParserModule.parseBookingText(textWithContext);
  return Array.isArray(result) ? result : [];
}

export function filterDetailsForType(details: Record<string, any>, type: string): Record<string, any> {
  const validKeys = PLAN_DETAIL_VALID_KEYS[type];
  if (!validKeys) return {};
  const aliases = PLAN_DETAIL_KEY_ALIASES[type] ?? {};
  const remapped = Object.fromEntries(
    Object.entries(details).map(([k, v]) => [aliases[k] ?? k, v]),
  );
  return Object.fromEntries(Object.entries(remapped).filter(([k]) => validKeys.has(k)));
}
