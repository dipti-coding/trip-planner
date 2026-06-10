import {runPrompt, truncate, extractJSON, str} from '../shared';

export type HotelDetails = {
  title: string | undefined;
  hotelName: string | undefined;
  confirmation: string | undefined;
  roomType: string | undefined;
  loyaltyNumber: string | undefined;
};

export async function extractHotelDetails(text: string): Promise<HotelDetails> {
  const raw = await runPrompt(
    'You are a hotel booking parser. Return only valid JSON, no explanation.',
    `Extract hotel details. Return:\n{"title":"hotel name","hotelName":"or null","confirmation":"code or null","roomType":"or null","loyaltyNumber":"or null"}\n\nText:\n${truncate(text)}`,
  );
  const d = extractJSON(raw) ?? {};
  return {
    title:         str(d.title),
    hotelName:     str(d.hotelName),
    confirmation:  str(d.confirmation),
    roomType:      str(d.roomType),
    loyaltyNumber: str(d.loyaltyNumber),
  };
}
