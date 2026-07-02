import type {Stage} from '../core/types';

export type RegexFieldConfig = {pattern: RegExp; group?: number};

// Deterministic token extraction. Each configured field collects every match (in
// document order) into ctx.meta[`${field}Candidates`]. Candidates are injected into
// LLM prompts as anchors and power graceful degradation; assignment of a candidate to
// a specific item/leg stays with the LLM (it owns that ambiguity). Kept out of direct
// field-fill on purpose — a mis-assigned deterministic value is worse than none.
export function RegexStage(cfg: {fields: Record<string, RegexFieldConfig>}): Stage {
  return {
    name: 'regex',
    run(ctx) {
      for (const [name, {pattern, group}] of Object.entries(cfg.fields)) {
        const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
        const found: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(ctx.text))) {
          const v = (group != null ? m[group] : m[0])?.trim();
          if (v && !found.includes(v)) found.push(v);
        }
        ctx.meta[`${name}Candidates`] = found;
      }
      return ctx;
    },
  };
}
