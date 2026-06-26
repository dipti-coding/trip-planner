// Content-driven mock for the on-device booking LLM (Apple Foundation Models),
// which is unavailable in jest. Instead of scripting a fixed sequence of answers,
// the mock reads the prompt to decide *which* fields a stage is asking for, then
// answers from the fixture's canonical structured data. This keeps tests robust to
// however many sub-questions a pipeline asks — assertions are on final output only.
import {NativeModules} from 'react-native';
import type {Fixture} from './corpus';

let current: Fixture | null = null;

export function useFixture(f: Fixture): void {
  current = f;
}

// Pull the field names out of the JSON template embedded in a stage's prompt
// (e.g. {"checkIn":"...","checkOut":"..."} → ['checkIn','checkOut']).
function requestedKeys(prompt: string): string[] {
  const keys = new Set<string>();
  const re = /"(\w+)"\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt))) keys.add(m[1]);
  return [...keys];
}

const mod = {
  async runPrompt(userPrompt: string, systemPrompt: string): Promise<string> {
    if (!current) throw new Error('mocks: no fixture set — call useFixture() first');

    // Classifier stage: reply with the single plan-type word.
    if (/classifier/i.test(systemPrompt)) return current.type;

    const keys = requestedKeys(userPrompt);
    const project = (src: Record<string, any> | undefined) =>
      Object.fromEntries(keys.map(k => [k, src?.[k] ?? null]));

    const data = current.canonical;
    // A template starting with `[{` means the stage wants a list (e.g. flight legs).
    if (/\[\s*\{/.test(userPrompt)) {
      const list = Array.isArray(data) ? data : data ? [data] : [];
      return JSON.stringify(list.map(project));
    }
    const obj = Array.isArray(data) ? data[0] : data;
    return JSON.stringify(project(obj));
  },

  // Generic single-stage native parser (non-dedicated types).
  async parseBookingText(): Promise<any[]> {
    return current?.generic ?? [];
  },
};

(NativeModules as any).BookingParserModule = mod;
