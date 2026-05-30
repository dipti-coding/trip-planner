export type PlanTypeMeta = {color: string; icon: string; bg: string[]};

/** icon values are Icon component name strings (see components/Icon.tsx) */
export const TYPE_META: Record<string, PlanTypeMeta> = {
  Flight:         {color: '#0f62fe', icon: 'plane',    bg: ['#4589ff', '#0f62fe']},
  Hotel:          {color: '#8a3ffc', icon: 'hotel',    bg: ['#be95ff', '#8a3ffc']},
  Restaurant:     {color: '#d2691e', icon: 'fork',     bg: ['#f1a266', '#d2691e']},
  Activity:       {color: '#198038', icon: 'map-pin',  bg: ['#42be65', '#198038']},
  Tour:           {color: '#198038', icon: 'compass',  bg: ['#42be65', '#198038']},
  LocalEvent:     {color: '#da1e28', icon: 'flag',     bg: ['#ff8389', '#da1e28']},
  CarReservation: {color: '#0f62fe', icon: 'route',    bg: ['#4589ff', '#0f62fe']},
  RailwayRide:    {color: '#0f62fe', icon: 'route',    bg: ['#4589ff', '#0f62fe']},
  BusRide:        {color: '#525252', icon: 'route',    bg: ['#8d8d8d', '#525252']},
  Ferry:          {color: '#0f62fe', icon: 'compass',  bg: ['#4589ff', '#0f62fe']},
  Cruise:         {color: '#0f62fe', icon: 'globe',    bg: ['#4589ff', '#0f62fe']},
  MapDestination: {color: '#525252', icon: 'map-pin',  bg: ['#8d8d8d', '#525252']},
  Meeting:        {color: '#525252', icon: 'calendar', bg: ['#8d8d8d', '#525252']},
};

export const DEFAULT_META: PlanTypeMeta = {color: '#525252', icon: 'star', bg: ['#8d8d8d', '#525252']};
