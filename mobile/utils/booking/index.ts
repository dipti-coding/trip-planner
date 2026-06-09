import {runPrompt, truncate, extractJSON} from './shared';
import type {ParsedPlan} from './shared';
import {parseFlightBooking} from './flight/parser';
import {parseHotelBooking} from './hotel/parser';
import {parseCarBooking} from './car/parser';
import {parseGenericBooking} from './generic/parser';

const VALID_TYPES = ['Flight', 'Hotel', 'CarReservation', 'Cruise', 'Ferry', 'RailwayRide', 'BusRide', 'Restaurant', 'Activity', 'Meeting'];

async function detectPlanType(text: string): Promise<string> {
  const raw = await runPrompt(
    'You are a travel booking classifier. Reply with a single word only.',
    `Classify this booking confirmation. Reply with exactly one word from this list:\n${VALID_TYPES.join(', ')}\n\nClassification rules:\n- Flight: must mention an airline, airport code, or flight number (e.g. AA271). "Journey" or travel-themed language alone is not enough.\n- Activity: shows, concerts, theater, sporting events, attractions, tours, theme parks, entertainment tickets.\n- Hotel: accommodation check-in/check-out booking.\n- Restaurant: dining reservation.\n- CarReservation: car rental pickup/dropoff.\n- RailwayRide/BusRide/Ferry/Cruise: the named transport type only.\n- Meeting: business or personal appointment.\n- When in doubt, prefer Activity over Flight.\n\nText:\n${truncate(text)}`,
  );
  const word = raw.trim().split(/\s/)[0] ?? '';
  return VALID_TYPES.includes(word) ? word : 'Activity';
}

export async function parseBooking(ocrText: string, tripYear: string): Promise<ParsedPlan[]> {
  const type = await detectPlanType(ocrText);
  console.log('[BookingPipeline] detected type:', type);

  switch (type) {
    case 'Flight':         return parseFlightBooking(ocrText, tripYear);
    case 'Hotel':          return parseHotelBooking(ocrText, tripYear);
    case 'CarReservation': return parseCarBooking(ocrText, tripYear);
    default:               return parseGenericBooking(ocrText, tripYear, type);
  }
}
