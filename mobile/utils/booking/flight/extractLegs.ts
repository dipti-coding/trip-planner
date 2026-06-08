import {runPrompt, truncate, extractJSON, str} from '../shared';

export type FlightLeg = {
  dep: string | undefined;
  arr: string | undefined;
  departs: string | undefined;
  arrives: string | undefined;
};

export async function extractFlightLegs(text: string, tripYear: string): Promise<FlightLeg[]> {
  const raw = await runPrompt(
    'You are a flight booking parser. Return only valid JSON, no explanation.',
    `Extract each flight leg. Return a JSON array:\n[{"dep":"IATA code","arr":"IATA code","departs":"ISO datetime or null","arrives":"ISO datetime or null"}]\nWhen a date has no year, use ${tripYear}.\n\nText:\n${truncate(text)}`,
  );
  const legs = extractJSON(raw);
  if (!Array.isArray(legs)) return [];
  return legs.map((leg: any) => ({
    dep: str(leg.dep),
    arr: str(leg.arr),
    departs: str(leg.departs),
    arrives: str(leg.arrives),
  }));
}
