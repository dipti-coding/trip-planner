import type {ParsedPlan} from '../shared';
import {extractCarLocations, type CarLocations} from './extractLocations';
import {extractCarDetails} from './extractDetails';

export async function parseCarBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const details = await extractCarDetails(text);
  console.log('[Car] stage1 extractDetails →', JSON.stringify(details));

  console.log('[Car] stage2 extractLocations context: rentalCompany =', details.rentalCompany, ', confirmation =', details.confirmation);
  let loc: CarLocations = {pickupLocation: undefined, dropoffLocation: undefined, pickupDateTime: undefined, returnDateTime: undefined};
  try {
    loc = await extractCarLocations(text, tripYear, details);
    console.log('[Car] stage2 extractLocations →', JSON.stringify(loc));
  } catch (err) {
    console.log('[Car] stage2 extractLocations failed after retries, using partial data:', (err as any)?.message);
  }

  const d: Record<string, string> = {};
  if (loc.pickupLocation)    d.pickup_location  = loc.pickupLocation;
  if (loc.dropoffLocation)   d.dropoff_location = loc.dropoffLocation;
  if (details.rentalCompany) d.rental_company   = details.rentalCompany;
  if (details.carType)       d.car_type         = details.carType;
  if (details.confirmation)  d.confirmation     = details.confirmation;
  if (details.driverName)    d.driver_name      = details.driverName;

  const plan = {
    type:           'CarReservation',
    title:          details.title ?? details.rentalCompany ?? 'Car Rental',
    start_datetime: loc.pickupDateTime,
    end_datetime:   loc.returnDateTime,
    details:        d,
  };
  console.log('[Car] final plan →', JSON.stringify(plan));
  return [plan];
}
