export type PlanTypeMeta = {color: string; icon: string};

/** icon values are Icon component name strings (see components/Icon.tsx) */
export const TYPE_META: Record<string, PlanTypeMeta> = {
  Flight:         {color: '#0f62fe', icon: 'plane'},
  Hotel:          {color: '#8a3ffc', icon: 'hotel'},
  Restaurant:     {color: '#d2691e', icon: 'fork'},
  Activity:       {color: '#198038', icon: 'map-pin'},
  Tour:           {color: '#198038', icon: 'compass'},
  LocalEvent:     {color: '#da1e28', icon: 'flag'},
  CarReservation: {color: '#0f62fe', icon: 'route'},
  RailwayRide:    {color: '#0f62fe', icon: 'route'},
  BusRide:        {color: '#525252', icon: 'route'},
  Ferry:          {color: '#0f62fe', icon: 'compass'},
  Cruise:         {color: '#0f62fe', icon: 'globe'},
  MapDestination: {color: '#525252', icon: 'map-pin'},
  Meeting:        {color: '#525252', icon: 'calendar'},
};

export const DEFAULT_META: PlanTypeMeta = {color: '#525252', icon: 'star'};
