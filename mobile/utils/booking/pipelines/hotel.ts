import {truncate, str} from '../shared';
import {Pipeline} from '../core/pipeline';
import {RegexStage} from '../stages/regexStage';
import {DateStage} from '../stages/dateStage';
import {LlmExtractStage} from '../stages/llmExtractStage';
import {ValidationStage} from '../stages/validationStage';

// Check-in/out are assigned deterministically (DateStage); the LLM only fills the
// non-date details.
const detailsStage = LlmExtractStage({
  name: 'extractDetails',
  systemPrompt: 'You are a hotel booking parser. Return only valid JSON, no explanation.',
  buildUserPrompt: ctx =>
    `Extract hotel details. Return:\n{"title":"hotel name","hotelName":"or null","confirmation":"code or null","roomType":"or null","loyaltyNumber":"or null"}\n\nText:\n${truncate(ctx.text)}`,
  mapping: [
    {field: 'title', from: r => str(r.title) ?? str(r.hotelName)},
    {field: 'confirmation', from: r => str(r.confirmation)},
    {field: 'room_type', from: r => str(r.roomType)},
    {field: 'loyalty_number', from: r => str(r.loyaltyNumber)},
  ],
});

export const hotelPipeline = new Pipeline('Hotel', [
  RegexStage({fields: {confirmation: {pattern: /\b[A-Z0-9]{6,8}\b/}}}),
  DateStage({
    targets: [
      {field: 'start_datetime', labels: [/check.?in/i]},
      {field: 'end_datetime', labels: [/check.?out/i]},
    ],
  }),
  detailsStage,
  ValidationStage({defaultTitle: 'Hotel'}),
]);
