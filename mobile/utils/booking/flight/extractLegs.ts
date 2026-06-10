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
    `Extract each flight leg. Return a JSON array:\n[{"dep":"IATA code","arr":"IATA code","departs":"ISO datetime or null","arrives":"ISO datetime or null"}]\nWhen a date has no year, use ${tripYear}. Use the day-of-month exactly as shown — do NOT adjust it to match the day-of-week name.\n\nFLIGHT LEG COUNTING RULES:\n- Two airports listed in sequence (first = departure, second = arrival) with times = EXACTLY ONE leg. The second airport's time is the ARRIVAL time, not a new departure.\n- Only return multiple elements when the passenger must change planes (e.g. LAX→ORD then ORD→STL = two elements). A seat-assignment section that repeats the same route is NOT a separate leg.\n- Do NOT invent a return leg. Only extract flights explicitly shown as departures in this confirmation.\n\nText:\n${truncate(text)}`,
  );
  const legs = extractJSON(raw);
  if (!Array.isArray(legs)) return [];
  return legs
    .map((leg: any) => ({
      dep: str(leg.dep),
      arr: str(leg.arr),
      departs: str(leg.departs),
      arrives: str(leg.arrives),
    }))
    .filter(leg => leg.dep && leg.arr && leg.dep !== leg.arr);
}
