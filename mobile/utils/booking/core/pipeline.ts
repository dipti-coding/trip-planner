import type {PipelineContext, Stage} from './types';

// Threads a context through an ordered list of stages, logging each stage's output
// (preserving the per-stage logging the old per-domain parsers had).
export class Pipeline {
  constructor(public readonly name: string, private readonly stages: Stage[]) {}

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    let cur = ctx;
    for (const stage of this.stages) {
      cur = await stage.run(cur);
      console.log(
        `[${this.name}] ${stage.name} →`,
        JSON.stringify(cur.items.map(i => i.fields)),
      );
    }
    return cur;
  }
}
