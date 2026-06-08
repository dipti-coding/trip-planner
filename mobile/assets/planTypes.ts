import type {PlanColorTokens} from '../theme';

export type PlanTypeMeta = {color: string; icon: string};

/** Build TYPE_META from the active theme's accent (plan-color) tokens. */
export function makePlanTypeMeta(acc: PlanColorTokens): Record<string, PlanTypeMeta> {
  return {
    Flight:         {color: acc.flight.base,  icon: 'plane'},
    Hotel:          {color: acc.hotel.base,   icon: 'hotel'},
    Restaurant:     {color: acc.food.base,    icon: 'fork'},
    Activity:       {color: acc.nature.base,  icon: 'map-pin'},
    CarReservation: {color: acc.flight.base,  icon: 'route'},
    RailwayRide:    {color: acc.flight.base,  icon: 'route'},
    BusRide:        {color: acc.neutral.base, icon: 'route'},
    Ferry:          {color: acc.flight.base,  icon: 'compass'},
    Cruise:         {color: acc.flight.base,  icon: 'globe'},
    Meeting:        {color: acc.neutral.base, icon: 'calendar'},
  };
}

export function makeDefaultMeta(acc: PlanColorTokens): PlanTypeMeta {
  return {color: acc.neutral.base, icon: 'star'};
}

export const PLAN_TYPE_LABEL: Record<string, string> = {
  Activity:       'Activity',
  Restaurant:     'Restaurant',
  Meeting:        'Meeting',
  Flight:         'Flight',
  Hotel:          'Hotel',
  CarReservation: 'Car Rental',
  Cruise:         'Cruise',
  Ferry:          'Ferry',
  RailwayRide:    'Railway',
  BusRide:        'Bus',
};
