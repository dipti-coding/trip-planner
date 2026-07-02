import {IATA_CODES} from '../data/iata';
import type {Stage} from '../core/types';

// Token-sequence detection: scans for 3-letter uppercase tokens that are known IATA
// airport codes, in document order, and records the ordered list in
// ctx.meta.iataCandidates. Like RegexStage, it produces anchors/candidates rather than
// assigning airports to legs — multi-leg assignment is the LLM's job.
export function IataStage(): Stage {
  return {
    name: 'iata',
    run(ctx) {
      const found: string[] = [];
      const re = /\b[A-Z]{3}\b/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(ctx.text))) {
        if (IATA_CODES.has(m[0])) found.push(m[0]);
      }
      ctx.meta.iataCandidates = found;
      return ctx;
    },
  };
}
