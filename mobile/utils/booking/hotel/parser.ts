import type {ParsedPlan} from '../shared';
import {extractHotelDates} from './extractDates';
import {extractHotelDetails} from './extractDetails';

export async function parseHotelBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const [dates, details] = await Promise.all([
    extractHotelDates(text, tripYear),
    extractHotelDetails(text),
  ]);

  const d: Record<string, string> = {};
  if (details.confirmation)  d.confirmation  = details.confirmation;
  if (details.roomType)      d.room_type     = details.roomType;
  if (details.loyaltyNumber) d.loyalty_number = details.loyaltyNumber;

  return [{
    type:           'Hotel',
    title:          details.title ?? details.hotelName ?? 'Hotel',
    start_datetime: dates.checkIn,
    end_datetime:   dates.checkOut,
    details:        d,
  }];
}
