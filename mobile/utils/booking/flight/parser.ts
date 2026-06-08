import type {ParsedPlan} from '../shared';
import {extractFlightLegs} from './extractLegs';
import {extractFlightDetails} from './extractDetails';

export async function parseFlightBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const legs = await extractFlightLegs(text, tripYear);
  if (legs.length === 0) return [];

  const details = await extractFlightDetails(text);

  return legs.map(leg => {
    const d: Record<string, string> = {};
    if (leg.dep)              d.departure_airport = leg.dep;
    if (leg.arr)              d.arrival_airport   = leg.arr;
    if (details.airline)      d.airline           = details.airline;
    if (details.confirmation) d.confirmation      = details.confirmation;
    if (details.serviceClass) d.cabin_class       = details.serviceClass;
    // flight_number and seat vary per leg; only apply on single-leg bookings
    if (legs.length === 1) {
      if (details.flightNumber) d.flight_number = details.flightNumber;
      if (details.seat)         d.seat          = details.seat;
    }
    return {
      type:            'Flight',
      title:           leg.dep && leg.arr ? `${leg.dep} → ${leg.arr}` : details.airline ?? 'Flight',
      start_datetime:  leg.departs,
      end_datetime:    leg.arrives,
      details:         d,
    };
  });
}
