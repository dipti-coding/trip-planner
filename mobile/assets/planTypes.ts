import {planColors} from '../theme';

export type PlanTypeMeta = {color: string; icon: string; bg: string[]};

/** icon values are Icon component name strings (see components/Icon.tsx) */
export const TYPE_META: Record<string, PlanTypeMeta> = {
  Flight:         {color: planColors.flight.base,  icon: 'plane',    bg: [planColors.flight.tint,  planColors.flight.base]},
  Hotel:          {color: planColors.hotel.base,   icon: 'hotel',    bg: [planColors.hotel.tint,   planColors.hotel.base]},
  Restaurant:     {color: planColors.food.base,    icon: 'fork',     bg: [planColors.food.tint,    planColors.food.base]},
  Activity:       {color: planColors.nature.base,  icon: 'map-pin',  bg: [planColors.nature.tint,  planColors.nature.base]},
  Tour:           {color: planColors.nature.base,  icon: 'compass',  bg: [planColors.nature.tint,  planColors.nature.base]},
  LocalEvent:     {color: planColors.event.base,   icon: 'flag',     bg: [planColors.event.tint,   planColors.event.base]},
  CarReservation: {color: planColors.flight.base,  icon: 'route',    bg: [planColors.flight.tint,  planColors.flight.base]},
  RailwayRide:    {color: planColors.flight.base,  icon: 'route',    bg: [planColors.flight.tint,  planColors.flight.base]},
  BusRide:        {color: planColors.neutral.base, icon: 'route',    bg: [planColors.neutral.tint, planColors.neutral.base]},
  Ferry:          {color: planColors.flight.base,  icon: 'compass',  bg: [planColors.flight.tint,  planColors.flight.base]},
  Cruise:         {color: planColors.flight.base,  icon: 'globe',    bg: [planColors.flight.tint,  planColors.flight.base]},
  MapDestination: {color: planColors.neutral.base, icon: 'map-pin',  bg: [planColors.neutral.tint, planColors.neutral.base]},
  Meeting:        {color: planColors.neutral.base, icon: 'calendar', bg: [planColors.neutral.tint, planColors.neutral.base]},
};

export const DEFAULT_META: PlanTypeMeta = {
  color: planColors.neutral.base,
  icon: 'star',
  bg: [planColors.neutral.tint, planColors.neutral.base],
};
