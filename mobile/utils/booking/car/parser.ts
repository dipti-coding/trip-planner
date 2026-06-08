import type {ParsedPlan} from '../shared';
import {extractCarLocations} from './extractLocations';
import {extractCarDetails} from './extractDetails';

export async function parseCarBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const [loc, details] = await Promise.all([
    extractCarLocations(text, tripYear),
    extractCarDetails(text),
  ]);

  const d: Record<string, string> = {};
  if (loc.pickupLocation)  d.pickup_location  = loc.pickupLocation;
  if (loc.dropoffLocation) d.dropoff_location = loc.dropoffLocation;
  if (details.rentalCompany) d.rental_company = details.rentalCompany;
  if (details.carType)       d.car_type       = details.carType;
  if (details.confirmation)  d.confirmation   = details.confirmation;
  if (details.driverName)    d.driver_name    = details.driverName;

  return [{
    type:           'CarReservation',
    title:          details.title ?? details.rentalCompany ?? 'Car Rental',
    start_datetime: loc.pickupDateTime,
    end_datetime:   loc.returnDateTime,
    details:        d,
  }];
}
