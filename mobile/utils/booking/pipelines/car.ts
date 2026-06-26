import {truncate, str} from '../shared';
import {getValue} from '../core/field';
import {Pipeline} from '../core/pipeline';
import {RegexStage} from '../stages/regexStage';
import {DateStage} from '../stages/dateStage';
import {LlmExtractStage} from '../stages/llmExtractStage';
import {ValidationStage} from '../stages/validationStage';

const detailsStage = LlmExtractStage({
  name: 'extractDetails',
  systemPrompt: 'You are a car rental booking parser. Return only valid JSON, no explanation.',
  buildUserPrompt: ctx =>
    `Extract car rental details. Return:\n{"title":"short title","rentalCompany":"or null","carType":"vehicle type or null","confirmation":"or null","driverName":"or null"}\n\nText:\n${truncate(ctx.text)}`,
  mapping: [
    {field: 'title', from: r => str(r.title) ?? str(r.rentalCompany)},
    {field: 'rental_company', from: r => str(r.rentalCompany)},
    {field: 'car_type', from: r => str(r.carType)},
    {field: 'confirmation', from: r => str(r.confirmation)},
    {field: 'driver_name', from: r => str(r.driverName)},
  ],
});

// Pickup/return datetimes are assigned deterministically (DateStage); the LLM provides
// the pickup/dropoff locations. Its date fields are lowest-confidence, so they never
// overwrite the deterministic ones.
const locationsStage = LlmExtractStage({
  name: 'extractLocations',
  systemPrompt: 'You are a car rental booking parser. Return only valid JSON, no explanation.',
  buildUserPrompt: ctx => {
    const item = ctx.items[0];
    const company = item ? getValue(item, 'rental_company') : undefined;
    const confirmation = item ? getValue(item, 'confirmation') : undefined;
    const anchor = company
      ? `Rental company: ${company}${confirmation ? `, Confirmation: ${confirmation}` : ''}.\n`
      : '';
    return `${anchor}Extract pickup and dropoff. Return:\n{"pickupLocation":"or null","dropoffLocation":"or null","pickupDateTime":"ISO datetime or null","returnDateTime":"ISO datetime or null"}\nWhen a date has no year, use ${ctx.tripYear}.\n\nText:\n${truncate(ctx.text)}`;
  },
  mapping: [
    {field: 'pickup_location', from: r => str(r.pickupLocation)},
    {field: 'dropoff_location', from: r => str(r.dropoffLocation)},
    {field: 'start_datetime', from: r => str(r.pickupDateTime)},
    {field: 'end_datetime', from: r => str(r.returnDateTime)},
  ],
});

export const carPipeline = new Pipeline('CarReservation', [
  RegexStage({fields: {confirmation: {pattern: /\b[A-Z0-9]{6,8}\b/}}}),
  DateStage({
    targets: [
      {field: 'start_datetime', labels: [/pick.?up/i]},
      {field: 'end_datetime', labels: [/drop.?off/i, /return/i]},
    ],
  }),
  detailsStage,
  locationsStage,
  ValidationStage({defaultTitle: 'Car Rental'}),
]);
