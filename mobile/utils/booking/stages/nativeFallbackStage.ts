import {runGenericParser} from '../shared';
import {emptyItem, setField} from '../core/field';
import type {Stage} from '../core/types';

const NATIVE_CONFIDENCE = 4;

// Wraps the on-device single-stage native parser (parseBookingText) for generic /
// non-dedicated plan types. Each returned plan becomes one item; title/start/end and
// every detail key are stored as fields. The plan type comes from ctx.type, so the
// native parser's own type guess is ignored (matching the old generic parser).
export function NativeFallbackStage(): Stage {
  return {
    name: 'nativeFallback',
    async run(ctx) {
      const textWithContext = `[Trip year: ${ctx.tripYear}. When a date has no year, use ${ctx.tripYear}. Use the day-of-month exactly as shown — do NOT adjust it to match the day-of-week name.]\n\n${ctx.text}`;
      const plans = await runGenericParser(textWithContext);
      ctx.items = plans.map(p => {
        const item = emptyItem();
        setField(item, 'title', p.title, NATIVE_CONFIDENCE, 'native');
        setField(item, 'start_datetime', p.start_datetime, NATIVE_CONFIDENCE, 'native');
        setField(item, 'end_datetime', p.end_datetime, NATIVE_CONFIDENCE, 'native');
        for (const [k, v] of Object.entries(p.details ?? {})) {
          setField(item, k, v == null ? undefined : String(v), NATIVE_CONFIDENCE, 'native');
        }
        return item;
      });
      return ctx;
    },
  };
}
