import type {Stage} from '../core/types';

export type ClassifierRule = {type: string; any: RegExp[]};

// Deterministic, high-precision classification. Rules are checked in order; the first
// whose pattern matches wins. When nothing matches, defers to the LLM fallback stage.
// Kept conservative on purpose — a wrong deterministic guess is worse than an LLM call.
export function KeywordClassifierStage(cfg: {rules: ClassifierRule[]; fallback: Stage}): Stage {
  return {
    name: 'keywordClassify',
    async run(ctx) {
      for (const rule of cfg.rules) {
        if (rule.any.some(re => re.test(ctx.text))) {
          ctx.type = rule.type;
          return ctx;
        }
      }
      return cfg.fallback.run(ctx);
    },
  };
}

export const CLASSIFIER_RULES: ClassifierRule[] = [
  {type: 'Flight', any: [/jetblue/i, /\bflight\s+\d/i, /\bairline\b/i, /boarding pass/i]},
  {type: 'Hotel', any: [/\bhotel\b/i]},
  {type: 'CarReservation', any: [/rent-?a-?car/i, /rental agreement/i, /car rental/i]},
  {type: 'Restaurant', any: [/opentable/i, /reservation confirmed/i, /table for \d/i]},
];
