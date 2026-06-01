import type {PlanColorTokens} from '../theme';

export type PlanTypeMeta = {color: string; icon: string; bg: string[]};

/** Build TYPE_META from the active theme's accent (plan-color) tokens. */
export function makePlanTypeMeta(acc: PlanColorTokens): Record<string, PlanTypeMeta> {
  return {
    Flight:         {color: acc.flight.base,  icon: 'plane',    bg: [acc.flight.tint,  acc.flight.base]},
    Hotel:          {color: acc.hotel.base,   icon: 'hotel',    bg: [acc.hotel.tint,   acc.hotel.base]},
    Restaurant:     {color: acc.food.base,    icon: 'fork',     bg: [acc.food.tint,    acc.food.base]},
    Activity:       {color: acc.nature.base,  icon: 'map-pin',  bg: [acc.nature.tint,  acc.nature.base]},
    Tour:           {color: acc.nature.base,  icon: 'compass',  bg: [acc.nature.tint,  acc.nature.base]},
    LocalEvent:     {color: acc.event.base,   icon: 'flag',     bg: [acc.event.tint,   acc.event.base]},
    CarReservation: {color: acc.flight.base,  icon: 'route',    bg: [acc.flight.tint,  acc.flight.base]},
    RailwayRide:    {color: acc.flight.base,  icon: 'route',    bg: [acc.flight.tint,  acc.flight.base]},
    BusRide:        {color: acc.neutral.base, icon: 'route',    bg: [acc.neutral.tint, acc.neutral.base]},
    Ferry:          {color: acc.flight.base,  icon: 'compass',  bg: [acc.flight.tint,  acc.flight.base]},
    Cruise:         {color: acc.flight.base,  icon: 'globe',    bg: [acc.flight.tint,  acc.flight.base]},
    MapDestination: {color: acc.neutral.base, icon: 'map-pin',  bg: [acc.neutral.tint, acc.neutral.base]},
    Meeting:        {color: acc.neutral.base, icon: 'calendar', bg: [acc.neutral.tint, acc.neutral.base]},
  };
}

export function makeDefaultMeta(acc: PlanColorTokens): PlanTypeMeta {
  return {color: acc.neutral.base, icon: 'star', bg: [acc.neutral.tint, acc.neutral.base]};
}
