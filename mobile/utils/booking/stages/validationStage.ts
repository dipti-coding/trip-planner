import {filterDetailsForType} from '../shared';
import {PLAN_DETAIL_VALID_KEYS} from '../detailSchema';
import {itemToValues} from '../core/field';
import type {ItemDraft, ParsedPlan, Stage} from '../core/types';

// Reserved field names that become plan-level scalars rather than `details`.
const RESERVED = new Set(['title', 'start_datetime', 'end_datetime']);

export type Validator = (value: string) => boolean;

export type ValidationConfig = {
  defaultTitle: string;
  // Drop any field below this confidence before building the plan.
  confidenceFloor?: number;
  // Per-field format validators; a failing field is dropped.
  validators?: Record<string, Validator>;
};

function buildPlan(item: ItemDraft, type: string, cfg: ValidationConfig): ParsedPlan {
  // Apply confidence floor + validators by pruning fields in place.
  for (const [name, f] of Object.entries(item.fields)) {
    const belowFloor = cfg.confidenceFloor != null && f.confidence < cfg.confidenceFloor;
    const invalid = cfg.validators?.[name] != null && !cfg.validators[name](f.value);
    if (belowFloor || invalid) delete item.fields[name];
  }

  const values = itemToValues(item);
  const rest: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (!RESERVED.has(k)) rest[k] = v;
  }
  const details = filterDetailsForType(rest, type);

  const expected = PLAN_DETAIL_VALID_KEYS[type];
  const missing = expected
    ? [...expected].filter(k => !(k in details))
    : [];

  return {
    type,
    title: values.title || cfg.defaultTitle,
    start_datetime: values.start_datetime,
    end_datetime: values.end_datetime,
    details,
    missing,
  };
}

// Final stage: turns items into the ParsedPlan[] result. Builds the detail map via the
// existing filterDetailsForType + detailSchema, and records `missing` (expected schema
// keys not filled). Result is stashed in ctx.meta.plans for the orchestrator.
export function ValidationStage(cfg: ValidationConfig): Stage {
  return {
    name: 'validate',
    run(ctx) {
      const type = ctx.type ?? 'Activity';
      ctx.meta.plans = ctx.items.map(item => buildPlan(item, type, cfg));
      return ctx;
    },
  };
}
