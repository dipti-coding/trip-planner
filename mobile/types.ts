export type Trip = {
  id: string;
  name: string;
  destination_city: string;
  start_date: string;
  end_date: string;
};

export type Plan = {
  id: string;
  type: string;
  title: string;
  start_datetime: string | null;
  end_datetime: string | null;
  details: Record<string, unknown>;
};
