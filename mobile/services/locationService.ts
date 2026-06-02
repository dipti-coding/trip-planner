import {DestinationType} from '../utils/destinations';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const localDestinations: {name: string; country: string; region: string | null; type: DestinationType}[] = require('../assets/destinations/destinations.json');

function localType(name: string, country: string, region: string | null): DestinationType | null {
  const n = name.toLowerCase();
  const c = country.toLowerCase();
  const r = region ? region.toLowerCase() : null;
  const candidates = localDestinations.filter(
    d => d.name.toLowerCase() === n && d.country.toLowerCase() === c,
  );
  if (candidates.length === 0) return null;
  if (r) {
    const withRegion = candidates.find(d => d.region && d.region.toLowerCase() === r);
    if (withRegion) return withRegion.type;
  }
  return candidates[0].type;
}

export type LocationResult = {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  type: DestinationType;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry: {coordinates: [number, number]};
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string;
    osm_value: string;
    name?: string;
    city?: string;
    country?: string;
    countrycode?: string;
    state?: string;
  };
};

function toDestType(osmValue: string, osmKey: string): DestinationType {
  if (['city', 'town', 'village', 'suburb', 'municipality'].includes(osmValue)) return 'city';
  if (osmValue === 'beach') return 'beach';
  if (['peak', 'mountain_range', 'ridge', 'volcano'].includes(osmValue)) return 'mountain';
  if (['island', 'islet', 'archipelago'].includes(osmValue)) return 'island';
  if (['park', 'nature_reserve', 'forest', 'national_park'].includes(osmValue)) return 'nature';
  if (['ruins', 'castle', 'monument', 'archaeological_site', 'heritage'].includes(osmValue)) return 'historical';
  if (osmKey === 'place') return 'city';
  return 'other';
}

export async function searchLocations(query: string, limit = 20): Promise<LocationResult[]> {
  const q = encodeURIComponent(query.trim());
  const url = `https://photon.komoot.io/api/?q=${q}&limit=${limit}&layer=city&layer=county&layer=state&layer=country&layer=locality`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photon error: ${res.status}`);
  const json = await res.json();
  const features: PhotonFeature[] = json.features ?? [];

  return features
    .filter(f => f.properties.name)
    .map(f => {
      const p = f.properties;
      const [lng, lat] = f.geometry.coordinates;
      return {
        id: `${p.osm_type}${p.osm_id}`,
        name: p.name ?? p.city ?? '',
        country: p.country ?? '',
        countryCode: (p.countrycode ?? '').toUpperCase(),
        type: localType(p.name ?? p.city ?? '', p.country ?? '', p.state ?? null) ?? toDestType(p.osm_value, p.osm_key),
        lat,
        lng,
      };
    });
}
