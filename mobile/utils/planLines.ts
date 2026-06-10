import type {Plan} from '../types';
import {AIRPORT_TZ} from './airportTimezones';
import {fmtTime, fmtTimeWithTZ} from './dates';

export type PlanLines = {
  heading: string;
  company: string | null;
  location: string | null;
  timeDisplay?: string;
};

export function getPlanLines(plan: Plan): PlanLines {
  const d = plan.details as Record<string, any>;

  switch (plan.type) {
    case 'Flight': {
      const route = d.departure_airport && d.arrival_airport
        ? `${d.departure_airport} → ${d.arrival_airport}`
        : null;
      const company = d.airline
        ? `${d.airline}${d.flight_number ? ' · ' + d.flight_number : ''}`
        : d.flight_number ?? null;
      const terminal = [
        d.terminal ? `Terminal ${d.terminal}` : null,
        d.gate     ? `Gate ${d.gate}`         : null,
      ].filter(Boolean).join(', ') || null;
      const depTz = d.departure_airport ? AIRPORT_TZ[d.departure_airport] : undefined;
      const arrTz = d.arrival_airport   ? AIRPORT_TZ[d.arrival_airport]   : undefined;
      let timeDisplay: string | undefined;
      if (plan.start_datetime && depTz) {
        const dep = fmtTimeWithTZ(plan.start_datetime, depTz);
        timeDisplay = plan.end_datetime && arrTz
          ? `${dep} → ${fmtTimeWithTZ(plan.end_datetime, arrTz)}`
          : dep;
      } else if (plan.start_datetime) {
        timeDisplay = fmtTime(plan.start_datetime);
      }
      return {heading: route ?? plan.title, company, location: terminal, timeDisplay};
    }

    case 'Hotel':
      return {heading: plan.title, company: d.room_type ?? null, location: null};

    case 'Restaurant': {
      const company = d.reservation_name
        ?? (d.party_size ? `Party of ${d.party_size}` : null);
      return {heading: plan.title, company, location: null};
    }

    case 'Activity':
      return {heading: plan.title, company: null, location: d.location ?? null};

    case 'CarReservation': {
      const route = d.pickup_location && d.dropoff_location
        ? `${d.pickup_location} → ${d.dropoff_location}`
        : null;
      return {heading: route ?? plan.title, company: d.rental_company ?? null, location: d.car_type ?? null};
    }

    case 'RailwayRide': {
      const route = d.departure_station && d.arrival_station
        ? `${d.departure_station} → ${d.arrival_station}`
        : null;
      const seat = [d.car_number ? `Car ${d.car_number}` : null, d.seat ? `Seat ${d.seat}` : null]
        .filter(Boolean).join(', ') || null;
      return {heading: route ?? plan.title, company: d.operator ?? null, location: seat};
    }

    case 'BusRide': {
      const route = d.departure_terminal && d.arrival_terminal
        ? `${d.departure_terminal} → ${d.arrival_terminal}`
        : null;
      return {heading: route ?? plan.title, company: d.operator ?? null, location: d.seat ?? null};
    }

    case 'Ferry': {
      const route = d.departure_port && d.arrival_port
        ? `${d.departure_port} → ${d.arrival_port}`
        : null;
      return {heading: route ?? plan.title, company: d.operator ?? null, location: d.vessel_name ?? null};
    }

    case 'Cruise': {
      const route = d.port_of_departure && d.port_of_arrival
        ? `${d.port_of_departure} → ${d.port_of_arrival}`
        : null;
      return {heading: route ?? plan.title, company: d.cruise_line ?? null, location: d.ship_name ?? null};
    }

    case 'Meeting':
      return {heading: plan.title, company: d.organizer ?? null, location: null};

    default:
      return {heading: plan.title, company: null, location: null};
  }
}

export type DetailRow = {
  icon: string;
  label: string;
  value: string;
  mono?: boolean;
};

export function getDetailRows(plan: Plan): DetailRow[] {
  const d = plan.details as Record<string, any>;
  const rows: DetailRow[] = [];

  const add = (icon: string, label: string, value: any, mono = false) => {
    if (value != null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      rows.push({icon, label, value: String(value), mono});
    }
  };

  switch (plan.type) {
    case 'Flight':
      if (d.departure_airport && d.arrival_airport)
        add('plane', 'Route', `${d.departure_airport} → ${d.arrival_airport}`);
      if (d.airline)
        add('flag', 'Airline', d.airline + (d.flight_number ? ' · ' + d.flight_number : ''));
      if (d.terminal || d.gate)
        add('map-pin', 'Terminal · Gate', [d.terminal ? `Terminal ${d.terminal}` : null, d.gate ? `Gate ${d.gate}` : null].filter(Boolean).join(' · '));
      add('star', 'Seat', d.seat);
      add('star', 'Class', d.cabin_class);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Hotel':
      add('hotel', 'Room', d.room_type);
      add('star', 'Loyalty #', d.loyalty_number, true);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Restaurant':
      add('user', 'Reservation', d.reservation_name);
      if (d.party_size) add('user', 'Party', `${d.party_size} people`);
      add('star', 'Dress code', d.dress_code);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Activity':
      add('map-pin', 'Location', d.location);
      add('check', 'Confirmation', d.confirmation, true);
      add('doc', 'Notes', d.notes);
      break;

    case 'CarReservation':
      add('flag', 'Company', d.rental_company);
      add('route', 'Car type', d.car_type);
      add('map-pin', 'Pickup', d.pickup_location);
      add('map-pin', 'Drop-off', d.dropoff_location);
      add('user', 'Driver', d.driver_name);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'RailwayRide':
      if (d.departure_station && d.arrival_station)
        add('route', 'Route', `${d.departure_station} → ${d.arrival_station}`);
      add('flag', 'Operator', d.operator);
      add('star', 'Train', d.train_number);
      if (d.car_number || d.seat)
        add('star', 'Car · Seat', [d.car_number ? `Car ${d.car_number}` : null, d.seat ? `Seat ${d.seat}` : null].filter(Boolean).join(' · '));
      add('star', 'Class', d.cabin_class);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'BusRide':
      if (d.departure_terminal && d.arrival_terminal)
        add('route', 'Route', `${d.departure_terminal} → ${d.arrival_terminal}`);
      add('flag', 'Operator', d.operator);
      add('star', 'Seat', d.seat);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Ferry':
      if (d.departure_port && d.arrival_port)
        add('compass', 'Route', `${d.departure_port} → ${d.arrival_port}`);
      add('flag', 'Operator', d.operator);
      add('star', 'Vessel', d.vessel_name);
      add('star', 'Class', d.seat_class);
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Cruise':
      add('globe', 'Line', d.cruise_line);
      add('star', 'Ship', d.ship_name);
      if (d.port_of_departure && d.port_of_arrival)
        add('route', 'Route', `${d.port_of_departure} → ${d.port_of_arrival}`);
      if (d.cabin_number || d.cabin_class)
        add('star', 'Cabin', [d.cabin_number, d.cabin_class].filter(Boolean).join(' · '));
      add('check', 'Confirmation', d.confirmation, true);
      break;

    case 'Meeting':
      add('user', 'Organizer', d.organizer);
      if (Array.isArray(d.attendees) && d.attendees.length)
        add('user', 'Attendees', d.attendees.join(', '));
      add('doc', 'Notes', d.notes);
      break;
  }

  return rows;
}

/** Returns a maps-navigable query string for the plan, or null if none. */
export function getMapsQuery(plan: Plan): string | null {
  const d = plan.details as Record<string, any>;
  switch (plan.type) {
    case 'Hotel':
    case 'Restaurant':
      return plan.title;
    case 'Activity':
      return d.location ?? null;
    case 'CarReservation':
      return d.pickup_location ?? null;
    case 'RailwayRide':
      return d.departure_station ?? null;
    case 'BusRide':
      return d.departure_terminal ?? null;
    case 'Ferry':
      return d.departure_port ?? null;
    default:
      return null;
  }
}
