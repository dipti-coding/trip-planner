import {runGenericParser} from '../shared';
import type {ParsedPlan} from '../shared';

export async function parseGenericBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const textWithContext = `[Trip year: ${tripYear}. When a date has no year, use ${tripYear}.]\n\n${text}`;
  return runGenericParser(textWithContext);
}
