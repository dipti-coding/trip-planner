export const PLAN_DETAIL_VALID_KEYS: Record<string, Set<string>> = {
  Activity:        new Set(['location', 'confirmation', 'notes']),
  Restaurant:      new Set(['location', 'reservation_name', 'party_size', 'confirmation', 'dress_code']),
  Meeting:         new Set(['location', 'meeting_link', 'organizer', 'attendees', 'notes']),
  Flight:          new Set(['airline', 'flight_number', 'seat', 'confirmation', 'departure_airport', 'arrival_airport', 'terminal', 'gate', 'cabin_class']),
  Hotel:           new Set(['location', 'confirmation', 'room_type', 'loyalty_number']),
  CarReservation:  new Set(['rental_company', 'confirmation', 'car_type', 'pickup_location', 'dropoff_location', 'driver_name']),
  Cruise:          new Set(['cruise_line', 'ship_name', 'confirmation', 'cabin_number', 'cabin_class', 'port_of_departure', 'port_of_arrival']),
  Ferry:           new Set(['operator', 'confirmation', 'departure_port', 'arrival_port', 'vessel_name', 'seat_class']),
  RailwayRide:     new Set(['operator', 'train_number', 'confirmation', 'departure_station', 'arrival_station', 'car_number', 'seat', 'cabin_class']),
  BusRide:         new Set(['operator', 'confirmation', 'departure_terminal', 'arrival_terminal', 'seat']),
};

// Maps raw parser field names to the correct schema field for a given plan type.
// Add entries here when a new type uses a different key for a semantically equivalent field.
export const PLAN_DETAIL_KEY_ALIASES: Record<string, Record<string, string>> = {
  Activity: {
    venue: 'location',
  },
};
