export type PlanTypeMeta = {color: string; icon: string};

export const TYPE_META: Record<string, PlanTypeMeta> = {
  Flight:         {color: '#0f62fe', icon: '✈'},
  Hotel:          {color: '#8a3ffc', icon: '🏨'},
  Restaurant:     {color: '#d2691e', icon: '🍴'},
  Activity:       {color: '#198038', icon: '📍'},
  Tour:           {color: '#198038', icon: '🗺'},
  LocalEvent:     {color: '#198038', icon: '🎪'},
  CarReservation: {color: '#0f62fe', icon: '🚗'},
  RailwayRide:    {color: '#0f62fe', icon: '🚅'},
  BusRide:        {color: '#525252', icon: '🚌'},
  Ferry:          {color: '#0f62fe', icon: '⛴'},
  Cruise:         {color: '#0f62fe', icon: '🚢'},
  MapDestination: {color: '#525252', icon: '📍'},
  Meeting:        {color: '#525252', icon: '🤝'},
};

export const DEFAULT_META: PlanTypeMeta = {color: '#525252', icon: '⭐'};
