import {runPrompt, truncate, extractJSON, str} from '../shared';

export type FlightDetails = {
  airline: string | undefined;
  flightNumber: string | undefined;
  seat: string | undefined;
  serviceClass: string | undefined;
  confirmation: string | undefined;
};

export async function extractFlightDetails(text: string): Promise<FlightDetails> {
  const raw = await runPrompt(
    'You are a flight booking parser. Return only valid JSON, no explanation.',
    `Extract flight booking details. Return a JSON object:\n{"airline":"or null","flightNumber":"e.g. UA123, or null","seat":"or null","serviceClass":"Economy/Business/etc or null","confirmation":"or null"}\n\nText:\n${truncate(text)}`,
  );
  const d = extractJSON(raw) ?? {};
  return {
    airline:       str(d.airline),
    flightNumber:  str(d.flightNumber),
    seat:          str(d.seat),
    serviceClass:  str(d.serviceClass),
    confirmation:  str(d.confirmation),
  };
}
