import {runPrompt, truncate, extractJSON, str} from '../shared';

export type CarDetails = {
  title: string | undefined;
  rentalCompany: string | undefined;
  carType: string | undefined;
  confirmation: string | undefined;
  driverName: string | undefined;
};

export async function extractCarDetails(text: string): Promise<CarDetails> {
  const raw = await runPrompt(
    'You are a car rental booking parser. Return only valid JSON, no explanation.',
    `Extract car rental details. Return:\n{"title":"short title","rentalCompany":"or null","carType":"vehicle type or null","confirmation":"or null","driverName":"or null"}\n\nText:\n${truncate(text)}`,
  );
  const d = extractJSON(raw) ?? {};
  return {
    title:         str(d.title),
    rentalCompany: str(d.rentalCompany),
    carType:       str(d.carType),
    confirmation:  str(d.confirmation),
    driverName:    str(d.driverName),
  };
}
