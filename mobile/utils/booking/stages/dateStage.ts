import {toISO, stripLeadingWeekday, findDateCandidates} from '../core/dates';
import {emptyItem, setField} from '../core/field';
import type {Stage} from '../core/types';

export type DateTarget = {field: string; labels: RegExp[]};

// Deterministic dates carry high confidence so the LLM never overwrites them.
const DATE_CONFIDENCE = 5;

function matchAnyLabel(line: string, labels: RegExp[]): RegExpExecArray | null {
  for (const re of labels) {
    const m = re.exec(line);
    if (m) return m;
  }
  return null;
}

// Find a datetime anchored to a label. Tries the text right after the label first;
// if that yields no time (or no date), stitches in the next 1-2 non-empty lines so a
// date and a time split across lines (common in OCR) are combined.
function labeledDateTime(text: string, labels: RegExp[], tripYear: string): string | undefined {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = matchAnyLabel(lines[i], labels);
    if (!m) continue;

    const afterLabel = stripLeadingWeekday(lines[i].slice(m.index + m[0].length));
    const direct = toISO(afterLabel, tripYear);
    if (direct && direct.includes('T')) return direct; // complete datetime on the label line

    const extra: string[] = [];
    for (let j = i + 1; j < lines.length && extra.length < 2; j++) {
      if (lines[j].trim()) extra.push(lines[j]);
    }
    const combined = stripLeadingWeekday([afterLabel, ...extra].join(' '));
    return toISO(combined, tripYear) ?? direct;
  }
  return undefined;
}

// Two modes:
// - `targets`: deterministically assign labeled date fields onto the (single) item.
// - `candidates`: emit all parseable datetimes into ctx.meta.dateCandidates for an
//   LLM assignment stage to map onto legs/locations (used for multi-leg flights).
export function DateStage(cfg: {targets?: DateTarget[]; candidates?: boolean}): Stage {
  return {
    name: 'dates',
    run(ctx) {
      if (cfg.candidates) {
        ctx.meta.dateCandidates = findDateCandidates(ctx.text, ctx.tripYear);
      }
      if (cfg.targets) {
        if (ctx.items.length === 0) ctx.items.push(emptyItem());
        const item = ctx.items[0];
        for (const t of cfg.targets) {
          setField(item, t.field, labeledDateTime(ctx.text, t.labels, ctx.tripYear), DATE_CONFIDENCE, 'date');
        }
      }
      return ctx;
    },
  };
}
