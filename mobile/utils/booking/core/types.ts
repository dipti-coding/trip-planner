// Core types for the composable booking-parse pipeline. Stages read and write a
// single PipelineContext; deterministic stages fill fields first and the LLM stages
// fill (or assign) the rest. See pipelines/ for how stages are composed per domain.

export type FieldSource = 'regex' | 'dict' | 'date' | 'llm' | 'native';

export type Field = {
  value: string;
  confidence: number;
  source: FieldSource;
};

// One ItemDraft per output plan. A multi-leg flight expands into N items.
// Plan-level scalars (title, start_datetime, end_datetime) are stored as reserved
// fields and split out by the validation stage; everything else becomes `details`.
export type ItemDraft = {
  fields: Record<string, Field>;
};

export type PipelineContext = {
  text: string;
  tripYear: string;
  type?: string;
  items: ItemDraft[];
  meta: Record<string, unknown>;
};

export type Stage = {
  name: string;
  run(ctx: PipelineContext): PipelineContext | Promise<PipelineContext>;
};

export type ParsedPlan = {
  type: string;
  title: string;
  start_datetime?: string;
  end_datetime?: string;
  details: Record<string, string>;
  // Schema fields the pipeline could not fill; for return value + logs only,
  // stripped before the from-parsed-bulk POST.
  missing?: string[];
};
