import type {ParsedPlan} from '../shared';
import {extractFlightLegs} from './extractLegs';
import {extractFlightDetails} from './extractDetails';

export async function parseFlightBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const legs = await extractFlightLegs(text, tripYear);
  console.log('[Flight] stage1 extractLegs →', JSON.stringify(legs));
  if (legs.length === 0) return [];

  console.log('[Flight] stage2 extractDetails context: legs =', JSON.stringify(legs));
  let detailsPerLeg: Awaited<ReturnType<typeof extractFlightDetails>> = [];
  try {
    detailsPerLeg = await extractFlightDetails(text, legs);
    console.log('[Flight] stage2 extractDetails →', JSON.stringify(detailsPerLeg));
  } catch (err) {
    console.log('[Flight] stage2 extractDetails failed after retries, using legs only:', (err as any)?.message);
  }

  const plans = legs.map((leg, i) => {
    const details = detailsPerLeg[i] ?? detailsPerLeg[0] ?? {};
    const d: Record<string, string> = {};
    if (leg.dep)              d.departure_airport = leg.dep;
    if (leg.arr)              d.arrival_airport   = leg.arr;
    if (details.airline)      d.airline           = details.airline;
    if (details.confirmation) d.confirmation      = details.confirmation;
    if (details.serviceClass) d.cabin_class       = details.serviceClass;
    if (details.flightNumber) d.flight_number     = details.flightNumber;
    if (details.seat)         d.seat              = details.seat;
    return {
      type:           'Flight',
      title:          leg.dep && leg.arr ? `${leg.dep} → ${leg.arr}` : details.airline ?? 'Flight',
      start_datetime: leg.departs,
      end_datetime:   leg.arrives,
      details:        d,
    };
  });
  console.log('[Flight] final plans →', JSON.stringify(plans));
  return plans;
}
