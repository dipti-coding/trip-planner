import {runGenericParser} from '../shared';
import type {ParsedPlan} from '../shared';

export async function parseGenericBooking(text: string, tripYear: string, detectedType: string): Promise<ParsedPlan[]> {
  const textWithContext = `[Trip year: ${tripYear}. When a date has no year, use ${tripYear}. Use the day-of-month exactly as shown — do NOT adjust it to match the day-of-week name.]\n\n${text}`;
  console.log('[Generic] running single-stage parser, detectedType =', detectedType, ', text length =', textWithContext.length);
  const plans = await runGenericParser(textWithContext);
  const forced = plans.map(p => ({...p, type: detectedType}));
  console.log('[Generic] result →', JSON.stringify(forced));
  return forced;
}
