import type {ParsedPlan} from '../shared';

// Characterization corpus built from real OCR dumps in ./ocr/*.txt.
// `canonical` / `generic` is the structured data the LLM mock answers from;
// `expected` is what the CURRENT pipeline produces and must keep producing
// after the refactor. (Date strings are wall-clock, no timezone — matching the
// frontend contract.) `missing` is documented here but asserted only in
// new-only tests post-refactor, since the current code computes no missing[].
export type Fixture = {
  name: string;
  ocrFile: string;
  type: string;
  tripYear: string;
  canonical?: Record<string, any> | Record<string, any>[];
  generic?: any[];
  expected: ParsedPlan[];
};

export const CORPUS: Fixture[] = [
  {
    name: 'flight-1-jetblue-mvy-jfk (single leg)',
    ocrFile: 'flight-1-jetblue-mvy-jfk.txt',
    type: 'Flight',
    tripYear: '2025',
    canonical: [
      {
        dep: 'MVY', arr: 'JFK',
        departs: '2025-10-14T12:58:00', arrives: '2025-10-14T13:59:00',
        confirmation: 'HKOFOK', airline: 'JetBlue', flightNumber: 'B6 1339',
        serviceClass: 'Blue', seat: null,
      },
    ],
    expected: [
      {
        type: 'Flight',
        title: 'MVY → JFK',
        start_datetime: '2025-10-14T12:58:00',
        end_datetime: '2025-10-14T13:59:00',
        details: {
          departure_airport: 'MVY', arrival_airport: 'JFK', airline: 'JetBlue',
          confirmation: 'HKOFOK', cabin_class: 'Blue', flight_number: 'B6 1339',
        },
      },
    ],
  },
  {
    name: 'flight-2-qatar-lax-blr (two legs)',
    ocrFile: 'flight-2-qatar-lax-blr.txt',
    type: 'Flight',
    tripYear: '2026',
    canonical: [
      {
        dep: 'LAX', arr: 'DOH',
        departs: '2026-01-07T15:10:00', arrives: '2026-01-08T17:50:00',
        confirmation: null, airline: 'Qatar Airways', flightNumber: 'QR 740',
        serviceClass: 'Economy', seat: null,
      },
      {
        dep: 'DOH', arr: 'BLR',
        departs: '2026-01-08T19:30:00', arrives: '2026-01-09T02:15:00',
        confirmation: null, airline: 'Qatar Airways', flightNumber: 'QR 4786',
        serviceClass: 'Economy', seat: null,
      },
    ],
    expected: [
      {
        type: 'Flight',
        title: 'LAX → DOH',
        start_datetime: '2026-01-07T15:10:00',
        end_datetime: '2026-01-08T17:50:00',
        details: {
          departure_airport: 'LAX', arrival_airport: 'DOH', airline: 'Qatar Airways',
          cabin_class: 'Economy', flight_number: 'QR 740',
        },
      },
      {
        type: 'Flight',
        title: 'DOH → BLR',
        start_datetime: '2026-01-08T19:30:00',
        end_datetime: '2026-01-09T02:15:00',
        details: {
          departure_airport: 'DOH', arrival_airport: 'BLR', airline: 'Qatar Airways',
          cabin_class: 'Economy', flight_number: 'QR 4786',
        },
      },
    ],
  },
  {
    name: 'car-1-mitsubishi',
    ocrFile: 'car-1-mitsubishi.txt',
    type: 'CarReservation',
    tripYear: '2024',
    canonical: {
      title: 'Car Rental', rentalCompany: null, carType: 'Mitsubishi Mirage or similar',
      confirmation: '39998152US5', driverName: null,
      pickupLocation: null, dropoffLocation: null,
      pickupDateTime: '2024-03-06T00:30:00', returnDateTime: '2024-03-09T22:30:00',
    },
    expected: [
      {
        type: 'CarReservation',
        title: 'Car Rental',
        start_datetime: '2024-03-06T00:30:00',
        end_datetime: '2024-03-09T22:30:00',
        details: {car_type: 'Mitsubishi Mirage or similar', confirmation: '39998152US5'},
      },
    ],
  },
  {
    name: 'car-2-enterprise (no return time)',
    ocrFile: 'car-2-enterprise.txt',
    type: 'CarReservation',
    tripYear: '2023',
    canonical: {
      title: 'Enterprise Rent-A-Car', rentalCompany: 'Enterprise',
      carType: 'Premium 4/5-Door/Automatic/Air', confirmation: '1QLXFY',
      driverName: 'ANKIT GOSWAMI',
      pickupLocation: 'Inverness, 4 Seafield Road, IV1 1SG', dropoffLocation: null,
      pickupDateTime: '2023-08-19T09:03:00', returnDateTime: null,
    },
    expected: [
      {
        type: 'CarReservation',
        title: 'Enterprise Rent-A-Car',
        start_datetime: '2023-08-19T09:03:00',
        details: {
          pickup_location: 'Inverness, 4 Seafield Road, IV1 1SG',
          rental_company: 'Enterprise', car_type: 'Premium 4/5-Door/Automatic/Air',
          confirmation: '1QLXFY', driver_name: 'ANKIT GOSWAMI',
        },
      },
    ],
  },
  {
    name: 'hotel-1-aria',
    ocrFile: 'hotel-1-aria.txt',
    type: 'Hotel',
    tripYear: '2025',
    canonical: {
      title: 'ARIA Resort & Casino', hotelName: 'ARIA Resort & Casino',
      confirmation: '7HDEOF5H26-', roomType: '1 Queen bed', loyaltyNumber: null,
      checkIn: '2025-09-04T15:00:00', checkOut: '2025-09-07T11:00:00',
    },
    expected: [
      {
        type: 'Hotel',
        title: 'ARIA Resort & Casino',
        start_datetime: '2025-09-04T15:00:00',
        end_datetime: '2025-09-07T11:00:00',
        details: {confirmation: '7HDEOF5H26-', room_type: '1 Queen bed'},
      },
    ],
  },
  {
    name: 'hotel-2-crowne-plaza (no confirmation, date-only)',
    ocrFile: 'hotel-2-crowne-plaza.txt',
    type: 'Hotel',
    tripYear: '2026',
    canonical: {
      title: 'Crowne Plaza Ventura Beach', hotelName: 'Crowne Plaza Ventura Beach',
      confirmation: null, roomType: 'Standard Room, 1 King Bed, Ocean View',
      loyaltyNumber: null, checkIn: '2026-02-14', checkOut: '2026-02-17',
    },
    expected: [
      {
        type: 'Hotel',
        title: 'Crowne Plaza Ventura Beach',
        start_datetime: '2026-02-14',
        end_datetime: '2026-02-17',
        details: {room_type: 'Standard Room, 1 King Bed, Ocean View'},
      },
    ],
  },
  {
    name: 'restaurant-opentable (generic path)',
    ocrFile: 'restaurant-opentable.txt',
    type: 'Restaurant',
    tripYear: '2025',
    generic: [
      {
        title: 'Roots Indian Bistro',
        start_datetime: '2025-12-20T12:00:00',
        details: {
          location: '7265 Melrose Ave, Los Angeles, CA 90046',
          reservation_name: 'Ankit Goswami', party_size: '3', confirmation: '29949',
        },
      },
    ],
    expected: [
      {
        type: 'Restaurant',
        title: 'Roots Indian Bistro',
        start_datetime: '2025-12-20T12:00:00',
        details: {
          location: '7265 Melrose Ave, Los Angeles, CA 90046',
          reservation_name: 'Ankit Goswami', party_size: '3', confirmation: '29949',
        },
      },
    ],
  },
  {
    name: 'activity-ka-cirque (generic path)',
    ocrFile: 'activity-ka-cirque.txt',
    type: 'Activity',
    tripYear: '2025',
    generic: [
      {
        title: 'KÀ by Cirque du Soleil',
        start_datetime: '2025-12-22T18:00:00',
        details: {location: 'MGM Grand Las Vegas', confirmation: '123150369'},
      },
    ],
    expected: [
      {
        type: 'Activity',
        title: 'KÀ by Cirque du Soleil',
        start_datetime: '2025-12-22T18:00:00',
        details: {location: 'MGM Grand Las Vegas', confirmation: '123150369'},
      },
    ],
  },
];
