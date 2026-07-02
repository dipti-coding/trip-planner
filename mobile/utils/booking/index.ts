import type {ParsedPlan, PipelineContext} from './core/types';
import {KeywordClassifierStage, CLASSIFIER_RULES} from './stages/keywordClassifier';
import {LlmClassifierStage} from './stages/llmClassifier';
import {getPipeline} from './pipelines';

export type {ParsedPlan};

// Orchestrator: classify (deterministic keywords → LLM fallback), then run the
// registered pipeline for that type. The pipeline's ValidationStage leaves the final
// ParsedPlan[] (each with `missing`) on ctx.meta.plans. Adding a domain touches only
// the pipeline registry, never this function.
export async function parseBooking(ocrText: string, tripYear: string): Promise<ParsedPlan[]> {
  const ctx: PipelineContext = {text: ocrText, tripYear, items: [], meta: {}};

  const classifier = KeywordClassifierStage({
    rules: CLASSIFIER_RULES,
    fallback: LlmClassifierStage(),
  });
  await classifier.run(ctx);
  console.log('[BookingPipeline] detected type:', ctx.type);

  const result = await getPipeline(ctx.type).run(ctx);
  return (result.meta.plans as ParsedPlan[] | undefined) ?? [];
}
