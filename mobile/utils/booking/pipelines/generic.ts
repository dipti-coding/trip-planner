import {Pipeline} from '../core/pipeline';
import {NativeFallbackStage} from '../stages/nativeFallbackStage';
import {ValidationStage} from '../stages/validationStage';

// Fallback for any type without a dedicated pipeline (Restaurant, Activity, Meeting,
// Cruise, Ferry, …). The native single-stage parser produces the items; ValidationStage
// filters details against ctx.type's schema.
export const genericPipeline = new Pipeline('Generic', [
  NativeFallbackStage(),
  ValidationStage({defaultTitle: 'Booking'}),
]);
