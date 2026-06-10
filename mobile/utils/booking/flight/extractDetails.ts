import {runPrompt, truncate, extractJSON, str} from '../shared';
import type {FlightLeg} from './extractLegs';

export type FlightDetails = {
  airline: string | undefined;
  flightNumber: string | undefined;
  seat: string | undefined;
  serviceClass: string | undefined;
  confirmation: string | undefined;
};

export async function extractFlightDetails(text: string, legs: FlightLeg[]): Promise<FlightDetails[]> {
  const legsJson = JSON.stringify(
    legs.map((l, i) => ({leg: i + 1, dep: l.dep, arr: l.arr, departs: l.departs, arrives: l.arrives})),
  );

  const raw = await runPrompt(
    'You are extracting structured airline reservation data. Return only valid JSON, no explanation.',
    `Known itinerary:\n${legsJson}\n\nMatch screenshot content against the itinerary.\n\nExtraction priority:\n1. Confirmation Number (PNR / Record Locator / Booking Ref)\n2. Airline\n3. Flight Number\n4. Service Class\n5. Seat Assignment\n\nRules:\n- Ignore ticket numbers longer than 10 digits unless explicitly labeled as PNR.\n- Confirmation numbers are usually 5-8 alphanumeric characters.\n- Flight numbers contain an airline designator and numeric identifier.\n- Match flights to itinerary airports and dates before assigning values.\n- If multiple candidate values exist, choose the one most closely associated with the matching itinerary segment.\n- Never invent values.\n\nFor each leg (same order as itinerary), return a JSON array:\n[{"confirmation":"or null","airline":"or null","flightNumber":"e.g. AA271 or null","serviceClass":"Economy/Business/etc or null","seat":"or null"}]\n\nText:\n${truncate(text)}`,
  );

  const arr = extractJSON(raw);
  const items: any[] = Array.isArray(arr) ? arr : legs.map(() => arr ?? {});

  return items.map((d: any) => ({
    confirmation: str(d.confirmation),
    airline:      str(d.airline),
    flightNumber: str(d.flightNumber),
    serviceClass: str(d.serviceClass),
    seat:         str(d.seat),
  }));
}
