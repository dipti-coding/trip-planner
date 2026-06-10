import type {ParsedPlan} from '../shared';
import {extractHotelDates, type HotelDates} from './extractDates';
import {extractHotelDetails} from './extractDetails';

export async function parseHotelBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const details = await extractHotelDetails(text);
  console.log('[Hotel] stage1 extractDetails →', JSON.stringify(details));

  console.log('[Hotel] stage2 extractDates context: hotelName =', details.hotelName, ', confirmation =', details.confirmation);
  let dates: HotelDates = {checkIn: undefined, checkOut: undefined};
  try {
    dates = await extractHotelDates(text, tripYear, details);
    console.log('[Hotel] stage2 extractDates →', JSON.stringify(dates));
  } catch (err) {
    console.log('[Hotel] stage2 extractDates failed after retries, using partial data:', (err as any)?.message);
  }

  const d: Record<string, string> = {};
  if (details.confirmation)  d.confirmation  = details.confirmation;
  if (details.roomType)      d.room_type     = details.roomType;
  if (details.loyaltyNumber) d.loyalty_number = details.loyaltyNumber;

  const plan = {
    type:           'Hotel',
    title:          details.title ?? details.hotelName ?? 'Hotel',
    start_datetime: dates.checkIn,
    end_datetime:   dates.checkOut,
    details:        d,
  };
  console.log('[Hotel] final plan →', JSON.stringify(plan));
  return [plan];
}
