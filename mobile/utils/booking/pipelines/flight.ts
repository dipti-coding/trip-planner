import {truncate, stripDayOfWeek, str} from '../shared';
import {getValue} from '../core/field';
import {Pipeline} from '../core/pipeline';
import type {PipelineContext} from '../core/types';
import {RegexStage} from '../stages/regexStage';
import {IataStage} from '../stages/iataStage';
import {DateStage} from '../stages/dateStage';
import {LlmExtractStage} from '../stages/llmExtractStage';
import {ValidationStage} from '../stages/validationStage';

function flightText(ctx: PipelineContext): string {
  return truncate(stripDayOfWeek(ctx.text));
}

// Deterministic airport codes + datetimes are passed to the LLM as disambiguation
// hints (the LLM still decides which applies to which leg).
function anchors(ctx: PipelineContext): string {
  const lines: string[] = [];
  const iata = ctx.meta.iataCandidates as string[] | undefined;
  const dates = ctx.meta.dateCandidates as string[] | undefined;
  if (iata?.length) lines.push(`Detected airport codes in order: ${iata.join(', ')}`);
  if (dates?.length) lines.push(`Detected date/times in order: ${dates.join(', ')}`);
  return lines.length
    ? `\n\nDeterministic hints (use to disambiguate; do not invent values):\n${lines.join('\n')}`
    : '';
}

const legsStage = LlmExtractStage({
  name: 'extractLegs',
  multiItem: true,
  systemPrompt: 'You are a flight booking parser. Return only valid JSON, no explanation.',
  buildUserPrompt: ctx =>
    `Extract each flight leg. Return a JSON array:\n[{"dep":"IATA code","arr":"IATA code","departs":"ISO datetime or null","arrives":"ISO datetime or null"}]\nWhen a date has no year, use ${ctx.tripYear}. Use the day-of-month exactly as shown — do NOT adjust it to match the day-of-week name.\n\nFLIGHT LEG COUNTING RULES:\n- Two airports listed in sequence (first = departure, second = arrival) with times = EXACTLY ONE leg. The second airport's time is the ARRIVAL time, not a new departure.\n- Only return multiple elements when the passenger must change planes (e.g. LAX→ORD then ORD→STL = two elements). A seat-assignment section that repeats the same route is NOT a separate leg.\n- Do NOT invent a return leg. Only extract flights explicitly shown as departures in this confirmation.\n\nText:\n${flightText(ctx)}${anchors(ctx)}`,
  toItems: json =>
    (Array.isArray(json) ? json : []).filter(l => {
      const dep = str(l?.dep);
      const arr = str(l?.arr);
      return dep && arr && dep !== arr;
    }),
  mapping: [
    {field: 'departure_airport', from: r => str(r.dep)},
    {field: 'arrival_airport', from: r => str(r.arr)},
    {field: 'start_datetime', from: r => str(r.departs)},
    {field: 'end_datetime', from: r => str(r.arrives)},
    {field: 'title', from: r => (str(r.dep) && str(r.arr) ? `${r.dep} → ${r.arr}` : undefined)},
  ],
});

const detailsStage = LlmExtractStage({
  name: 'extractDetails',
  systemPrompt: 'You are extracting structured airline reservation data. Return only valid JSON, no explanation.',
  buildUserPrompt: ctx => {
    const legsJson = JSON.stringify(
      ctx.items.map((item, i) => ({
        leg: i + 1,
        dep: getValue(item, 'departure_airport'),
        arr: getValue(item, 'arrival_airport'),
        departs: getValue(item, 'start_datetime'),
        arrives: getValue(item, 'end_datetime'),
      })),
    );
    return `Known itinerary:\n${legsJson}\n\nMatch screenshot content against the itinerary.\n\nExtraction priority:\n1. Confirmation Number (PNR / Record Locator / Booking Ref)\n2. Airline\n3. Flight Number\n4. Service Class\n5. Seat Assignment\n\nRules:\n- Ignore ticket numbers longer than 10 digits unless explicitly labeled as PNR.\n- Confirmation numbers are usually 5-8 alphanumeric characters.\n- Flight numbers contain an airline designator and numeric identifier.\n- Match flights to itinerary airports and dates before assigning values.\n- If multiple candidate values exist, choose the one most closely associated with the matching itinerary segment.\n- Never invent values.\n\nFor each leg (same order as itinerary), return a JSON array:\n[{"confirmation":"or null","airline":"or null","flightNumber":"e.g. AA271 or null","serviceClass":"Economy/Business/etc or null","seat":"or null"}]\n\nText:\n${flightText(ctx)}`;
  },
  mapping: [
    {field: 'confirmation', from: r => str(r.confirmation)},
    {field: 'airline', from: r => str(r.airline)},
    {field: 'flight_number', from: r => str(r.flightNumber)},
    {field: 'cabin_class', from: r => str(r.serviceClass)},
    {field: 'seat', from: r => str(r.seat)},
  ],
});

export const flightPipeline = new Pipeline('Flight', [
  RegexStage({fields: {flightNumber: {pattern: /\b[A-Z]{2}\s?\d{1,4}\b/}}}),
  IataStage(),
  DateStage({candidates: true}),
  legsStage,
  detailsStage,
  ValidationStage({defaultTitle: 'Flight'}),
]);
