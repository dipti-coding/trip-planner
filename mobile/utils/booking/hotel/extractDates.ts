import {runPrompt, truncate, extractJSON, str} from '../shared';

export type HotelDates = {
  checkIn: string | undefined;
  checkOut: string | undefined;
};

export async function extractHotelDates(
  text: string,
  tripYear: string,
  ctx?: {hotelName?: string; confirmation?: string},
): Promise<HotelDates> {
  const anchor = ctx?.hotelName
    ? `Hotel: ${ctx.hotelName}${ctx.confirmation ? `, Confirmation: ${ctx.confirmation}` : ''}.\n`
    : '';
  const raw = await runPrompt(
    'You are a hotel booking parser. Return only valid JSON, no explanation.',
    `${anchor}Extract check-in and check-out dates for this booking. Return:\n{"checkIn":"ISO datetime or null","checkOut":"ISO datetime or null"}\nWhen a date has no year, use ${tripYear}.\n\nText:\n${truncate(text)}`,
  );
  const d = extractJSON(raw) ?? {};
  return {checkIn: str(d.checkIn), checkOut: str(d.checkOut)};
}
