// Small set of IATA airport codes used to deterministically detect airport tokens in
// flight screenshots. Not exhaustive — extend as real OCR dumps surface new codes.
// Covers the current fixture corpus plus common hubs.
export const IATA_CODES = new Set<string>([
  // fixture corpus
  'MVY', 'JFK', 'LAX', 'DOH', 'BLR',
  // common US
  'SFO', 'LGA', 'EWR', 'ORD', 'STL', 'ATL', 'DFW', 'DEN', 'SEA', 'BOS',
  'MIA', 'SAN', 'LAS', 'PHX', 'IAD', 'IAH',
  // common intl
  'LHR', 'CDG', 'AMS', 'FRA', 'DXB', 'SIN', 'HKG', 'NRT', 'HND', 'BOM',
  'DEL', 'SYD', 'YYZ', 'MEX', 'GRU',
]);
