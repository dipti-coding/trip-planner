import {NativeModules} from 'react-native';

const {BookingParserModule} = NativeModules;

const MAX_OCR_CHARS = 3000;

export type ParsedPlan = {
  type: string;
  title: string;
  start_datetime?: string;
  end_datetime?: string;
  details: Record<string, string>;
};

function truncate(text: string): string {
  return text.length > MAX_OCR_CHARS ? text.slice(0, MAX_OCR_CHARS) : text;
}

// Extract a JSON array or object from raw model output.
function extractJSON(raw: string): any {
  const arrS = raw.indexOf('['), arrE = raw.lastIndexOf(']');
  if (arrS !== -1 && arrE !== -1) {
    try { return JSON.parse(raw.slice(arrS, arrE + 1)); } catch {}
  }
  const objS = raw.indexOf('{'), objE = raw.lastIndexOf('}');
  if (objS !== -1 && objE !== -1) {
    try { return JSON.parse(raw.slice(objS, objE + 1)); } catch {}
  }
  return null;
}

function str(v: any): string | undefined {
  if (v == null || v === 'null' || v === '') return undefined;
  return String(v);
}

async function runPrompt(systemPrompt: string, userPrompt: string): Promise<string> {
  return BookingParserModule.runPrompt(userPrompt, systemPrompt);
}

async function detectPlanType(text: string): Promise<string> {
  const raw = await runPrompt(
    'You are a travel booking classifier. Reply with a single word only.',
    `Classify this booking confirmation. Reply with exactly one word from this list:\nFlight, Hotel, CarReservation, Cruise, Ferry, RailwayRide, BusRide, Restaurant, Activity, Meeting\n\nText:\n${truncate(text)}`,
  );
  const word = raw.trim().split(/\s/)[0] ?? '';
  const valid = ['Flight', 'Hotel', 'CarReservation', 'Cruise', 'Ferry', 'RailwayRide', 'BusRide', 'Restaurant', 'Activity', 'Meeting'];
  return valid.includes(word) ? word : 'Activity';
}

async function parseFlightBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const yearHint = `When a date has no year, use ${tripYear}.`;
  const t = truncate(text);

  // Stage 1: leg structure — focused only on airports + times
  const legsRaw = await runPrompt(
    'You are a flight booking parser. Return only valid JSON, no explanation.',
    `Extract each flight leg. Return a JSON array:\n[{"dep":"IATA code","arr":"IATA code","departs":"ISO datetime or null","arrives":"ISO datetime or null"}]\n${yearHint}\n\nText:\n${t}`,
  );
  const legs = extractJSON(legsRaw);
  if (!Array.isArray(legs) || legs.length === 0) return [];

  // Stage 2: booking-level details shared across all legs
  const detailsRaw = await runPrompt(
    'You are a flight booking parser. Return only valid JSON, no explanation.',
    `Extract flight booking details. Return a JSON object:\n{"airline":"or null","flightNumber":"e.g. UA123, or null","seat":"or null","serviceClass":"Economy/Business/etc or null","confirmation":"or null"}\n\nText:\n${t}`,
  );
  const details = extractJSON(detailsRaw) ?? {};

  const airline = str(details.airline);
  const confirmation = str(details.confirmation);
  const cabinClass = str(details.serviceClass);

  return legs.map((leg: any) => {
    const dep = str(leg.dep);
    const arr = str(leg.arr);
    const d: Record<string, string> = {};
    if (dep) d.departure_airport = dep;
    if (arr) d.arrival_airport = arr;
    if (airline) d.airline = airline;
    if (confirmation) d.confirmation = confirmation;
    if (cabinClass) d.cabin_class = cabinClass;
    // flight_number and seat vary per leg; only include on single-leg bookings
    if (legs.length === 1) {
      const flightNum = str(details.flightNumber);
      const seat = str(details.seat);
      if (flightNum) d.flight_number = flightNum;
      if (seat) d.seat = seat;
    }
    return {
      type: 'Flight',
      title: dep && arr ? `${dep} → ${arr}` : airline ?? 'Flight',
      start_datetime: str(leg.departs),
      end_datetime: str(leg.arrives),
      details: d,
    };
  });
}

async function parseHotelBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const yearHint = `When a date has no year, use ${tripYear}.`;
  const t = truncate(text);

  // Stage 1: dates only — the primary failure mode for hotels
  const datesRaw = await runPrompt(
    'You are a hotel booking parser. Return only valid JSON, no explanation.',
    `Extract check-in and check-out dates. Return:\n{"checkIn":"ISO datetime or null","checkOut":"ISO datetime or null"}\n${yearHint}\n\nText:\n${t}`,
  );
  const dates = extractJSON(datesRaw) ?? {};

  // Stage 2: remaining details
  const detailsRaw = await runPrompt(
    'You are a hotel booking parser. Return only valid JSON, no explanation.',
    `Extract hotel details. Return:\n{"title":"hotel name","hotelName":"or null","confirmation":"code or null","roomType":"or null","loyaltyNumber":"or null"}\n\nText:\n${t}`,
  );
  const details = extractJSON(detailsRaw) ?? {};

  const d: Record<string, string> = {};
  const conf = str(details.confirmation);
  const room = str(details.roomType);
  const loyalty = str(details.loyaltyNumber);
  if (conf) d.confirmation = conf;
  if (room) d.room_type = room;
  if (loyalty) d.loyalty_number = loyalty;

  return [{
    type: 'Hotel',
    title: str(details.title) ?? str(details.hotelName) ?? 'Hotel',
    start_datetime: str(dates.checkIn),
    end_datetime: str(dates.checkOut),
    details: d,
  }];
}

async function parseCarBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const yearHint = `When a date has no year, use ${tripYear}.`;
  const t = truncate(text);

  // Stage 1: locations + dates
  const locRaw = await runPrompt(
    'You are a car rental booking parser. Return only valid JSON, no explanation.',
    `Extract pickup and dropoff. Return:\n{"pickupLocation":"or null","dropoffLocation":"or null","pickupDateTime":"ISO datetime or null","returnDateTime":"ISO datetime or null"}\n${yearHint}\n\nText:\n${t}`,
  );
  const loc = extractJSON(locRaw) ?? {};

  // Stage 2: booking details
  const detailsRaw = await runPrompt(
    'You are a car rental booking parser. Return only valid JSON, no explanation.',
    `Extract car rental details. Return:\n{"title":"short title","rentalCompany":"or null","carType":"vehicle type or null","confirmation":"or null","driverName":"or null"}\n\nText:\n${t}`,
  );
  const details = extractJSON(detailsRaw) ?? {};

  const d: Record<string, string> = {};
  const pickup = str(loc.pickupLocation);
  const dropoff = str(loc.dropoffLocation);
  const company = str(details.rentalCompany);
  const carType = str(details.carType);
  const conf = str(details.confirmation);
  const driver = str(details.driverName);
  if (pickup) d.pickup_location = pickup;
  if (dropoff) d.dropoff_location = dropoff;
  if (company) d.rental_company = company;
  if (carType) d.car_type = carType;
  if (conf) d.confirmation = conf;
  if (driver) d.driver_name = driver;

  return [{
    type: 'CarReservation',
    title: str(details.title) ?? str(company) ?? 'Car Rental',
    start_datetime: str(loc.pickupDateTime),
    end_datetime: str(loc.returnDateTime),
    details: d,
  }];
}

// Fallback for types without a specialized pipeline — delegates to the original Swift parser
// which handles field mapping and date normalization (toISO) internally.
async function parseGenericBooking(text: string, tripYear: string): Promise<ParsedPlan[]> {
  const textWithContext = `[Trip year: ${tripYear}. When a date has no year, use ${tripYear}.]\n\n${text}`;
  const result = await BookingParserModule.parseBookingText(textWithContext);
  return Array.isArray(result) ? result : [];
}

export async function parseBooking(ocrText: string, tripYear: string): Promise<ParsedPlan[]> {
  const type = await detectPlanType(ocrText);
  console.log('[BookingPipeline] detected type:', type);

  switch (type) {
    case 'Flight':        return parseFlightBooking(ocrText, tripYear);
    case 'Hotel':         return parseHotelBooking(ocrText, tripYear);
    case 'CarReservation': return parseCarBooking(ocrText, tripYear);
    default:              return parseGenericBooking(ocrText, tripYear);
  }
}
