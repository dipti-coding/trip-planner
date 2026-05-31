export type DestinationType =
  | 'city'
  | 'beach'
  | 'mountain'
  | 'nature'
  | 'historical'
  | 'island'
  | 'other';

export type Destination = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  region: string | null;
  type: DestinationType;
  coordinates: {lat: number; lng: number};
  globalRank: number;
  usRank: number | null;
  image: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const destinations: Destination[] = require('../assets/destinations/destinations.json');

// Western / broadly popular travel markets — shown first in the add-trip picker
const WESTERN_CODES = new Set([
  'US', 'CA', 'MX',
  'GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT',
  'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'GR', 'HR', 'CZ', 'PL',
  'HU', 'SK', 'SI', 'LU', 'MT', 'CY',
  'AU', 'NZ',
  'JP', 'KR', 'SG', 'TW',
  'AE', 'IL', 'TR', 'ZA', 'MA',
  'BR', 'AR', 'CL', 'CO', 'PE', 'CR', 'DO',
]);

const westernSorted = [...destinations].sort(
  (a, b) =>
    (WESTERN_CODES.has(a.countryCode) ? 0 : 1) -
    (WESTERN_CODES.has(b.countryCode) ? 0 : 1) ||
    a.globalRank - b.globalRank,
);

export function searchDestinations(query: string, limit = 20): Destination[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return westernSorted.slice(0, limit);
  }
  const results: Destination[] = [];
  for (const d of westernSorted) {
    if (
      d.name.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      (d.region ?? '').toLowerCase().includes(q) ||
      d.countryCode.toLowerCase() === q
    ) {
      results.push(d);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function findDestination(cityString: string): Destination | null {
  if (!cityString) return null;
  const primary = cityString.split(/,\s*/)[0].toLowerCase().trim();

  // Exact name match
  let match = destinations.find(d => d.name.toLowerCase() === primary);
  if (match) return match;

  // Prefix match (either direction)
  match = destinations.find(
    d =>
      d.name.toLowerCase().startsWith(primary) ||
      primary.startsWith(d.name.toLowerCase()),
  );
  if (match) return match;

  // Contains match — require destination name ≥ 4 chars to avoid short noise matches
  return (
    destinations.find(d => {
      const dn = d.name.toLowerCase();
      return dn.length >= 4 && (dn.includes(primary) || primary.includes(dn));
    }) ?? null
  );
}

