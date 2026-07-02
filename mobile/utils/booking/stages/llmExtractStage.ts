import {runPrompt, extractJSON} from '../shared';
import {emptyItem, setField} from '../core/field';
import type {PipelineContext, Stage} from '../core/types';

type RawItem = Record<string, any>;

// One field mapping: which item field to set, and how to derive it from the LLM's
// raw JSON for this item. Returning undefined leaves the field for another stage.
export type FieldMap = {
  field: string;
  from: (raw: RawItem, ctx: PipelineContext) => string | undefined;
};

export type LlmExtractConfig = {
  name: string;
  systemPrompt: string;
  buildUserPrompt: (ctx: PipelineContext) => string;
  mapping: FieldMap[];
  // Normalize the parsed JSON to an array of raw items. Default: wrap an object in
  // a 1-element array; pass arrays through.
  toItems?: (json: any) => RawItem[];
  // true → this stage defines the set of items (e.g. flight legs); false → it merges
  // into existing items by index (reusing index 0 when the LLM returns fewer).
  multiItem?: boolean;
};

// LLM source is the lowest confidence so deterministic stages (regex/date/native)
// always win; the LLM only fills what determinism left empty.
const LLM_CONFIDENCE = 1;

const defaultToItems = (json: any): RawItem[] =>
  Array.isArray(json) ? json : [json ?? {}];

// Generalizes the old per-domain flight/hotel/car extract stages into one object that
// is configured entirely by data. Reads ctx.items to skip targets already filled
// deterministically (via setField confidence) and may inject known fields as anchors
// through buildUserPrompt.
export function LlmExtractStage(cfg: LlmExtractConfig): Stage {
  const toItems = cfg.toItems ?? defaultToItems;
  return {
    name: cfg.name,
    async run(ctx) {
      const raw = await runPrompt(cfg.systemPrompt, cfg.buildUserPrompt(ctx));
      const parsed = toItems(extractJSON(raw));

      const apply = (item: RawItem, target: ReturnType<typeof emptyItem>) => {
        for (const m of cfg.mapping) {
          setField(target, m.field, m.from(item, ctx), LLM_CONFIDENCE, 'llm');
        }
      };

      if (cfg.multiItem || ctx.items.length === 0) {
        ctx.items = parsed.map(item => {
          const target = emptyItem();
          apply(item, target);
          return target;
        });
        return ctx;
      }

      // Merge into existing items by index; reuse parsed[0] when the LLM returned
      // fewer entries than items (mirrors the old detailsPerLeg[i] ?? detailsPerLeg[0]).
      ctx.items.forEach((target, i) => {
        const item = parsed[i] ?? parsed[0];
        if (item) apply(item, target);
      });
      return ctx;
    },
  };
}
