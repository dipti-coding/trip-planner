import {NativeModules} from 'react-native';

const {BookingParserModule} = NativeModules;

export const MAX_OCR_CHARS = 3000;

export type ParsedPlan = {
  type: string;
  title: string;
  start_datetime?: string;
  end_datetime?: string;
  details: Record<string, string>;
};

export function truncate(text: string): string {
  return text.length > MAX_OCR_CHARS ? text.slice(0, MAX_OCR_CHARS) : text;
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

export async function runPrompt(systemPrompt: string, userPrompt: string): Promise<string> {
  return BookingParserModule.runPrompt(userPrompt, systemPrompt);
}

export async function runGenericParser(textWithContext: string): Promise<any[]> {
  const result = await BookingParserModule.parseBookingText(textWithContext);
  return Array.isArray(result) ? result : [];
}
