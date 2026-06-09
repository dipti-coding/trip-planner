import {runPrompt, truncate, extractJSON, str} from '../shared';

export type CarLocations = {
  pickupLocation: string | undefined;
  dropoffLocation: string | undefined;
  pickupDateTime: string | undefined;
  returnDateTime: string | undefined;
};

export async function extractCarLocations(
  text: string,
  tripYear: string,
  ctx?: {rentalCompany?: string; confirmation?: string},
): Promise<CarLocations> {
  const anchor = ctx?.rentalCompany
    ? `Rental company: ${ctx.rentalCompany}${ctx.confirmation ? `, Confirmation: ${ctx.confirmation}` : ''}.\n`
    : '';
  const raw = await runPrompt(
    'You are a car rental booking parser. Return only valid JSON, no explanation.',
    `${anchor}Extract pickup and dropoff. Return:\n{"pickupLocation":"or null","dropoffLocation":"or null","pickupDateTime":"ISO datetime or null","returnDateTime":"ISO datetime or null"}\nWhen a date has no year, use ${tripYear}.\n\nText:\n${truncate(text)}`,
  );
  const d = extractJSON(raw) ?? {};
  return {
    pickupLocation:  str(d.pickupLocation),
    dropoffLocation: str(d.dropoffLocation),
    pickupDateTime:  str(d.pickupDateTime),
    returnDateTime:  str(d.returnDateTime),
  };
}
