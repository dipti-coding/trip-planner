import {runPrompt, truncate} from '../shared';
import type {Stage} from '../core/types';

export const VALID_TYPES = [
  'Flight', 'Hotel', 'CarReservation', 'Cruise', 'Ferry', 'RailwayRide',
  'BusRide', 'Restaurant', 'Activity', 'Meeting',
];

// LLM classification fallback — verbatim prompt from the original index.ts so behavior
// (and the content-driven test mock) is unchanged. Used only when the deterministic
// keyword classifier finds no confident match.
export function LlmClassifierStage(): Stage {
  return {
    name: 'llmClassify',
    async run(ctx) {
      const raw = await runPrompt(
        'You are a travel booking classifier. Reply with a single word only.',
        `Classify this booking confirmation. Reply with exactly one word from this list:\n${VALID_TYPES.join(', ')}\n\nClassification rules:\n- Flight: must mention an airline, airport code, or flight number (e.g. AA271). "Journey" or travel-themed language alone is not enough.\n- Activity: shows, concerts, theater, sporting events, attractions, tours, theme parks, entertainment tickets.\n- Hotel: accommodation check-in/check-out booking.\n- Restaurant: dining reservation.\n- CarReservation: car rental pickup/dropoff.\n- RailwayRide/BusRide/Ferry/Cruise: the named transport type only.\n- Meeting: business or personal appointment.\n- When in doubt, prefer Activity over Flight.\n\nText:\n${truncate(ctx.text)}`,
      );
      const word = raw.trim().split(/\s/)[0] ?? '';
      ctx.type = VALID_TYPES.includes(word) ? word : 'Activity';
      return ctx;
    },
  };
}
