import type {Pipeline} from '../core/pipeline';
import {flightPipeline} from './flight';
import {hotelPipeline} from './hotel';
import {carPipeline} from './car';
import {genericPipeline} from './generic';

// Adding a domain = a new entry here + its pipeline file. The orchestrator and
// parseBooking never change.
const REGISTRY: Record<string, Pipeline> = {
  Flight: flightPipeline,
  Hotel: hotelPipeline,
  CarReservation: carPipeline,
};

export function getPipeline(type: string | undefined): Pipeline {
  return (type && REGISTRY[type]) || genericPipeline;
}
