#!/usr/bin/env python3
"""
Generate trip planner destination database and download images.

Usage:
  python scripts/generate_destinations.py --phase fetch-data
  python scripts/generate_destinations.py --phase download-images
  python scripts/generate_destinations.py --phase generate-index
  python scripts/generate_destinations.py --phase all
"""
import argparse
import io
import json
import re
import time
import zipfile
from pathlib import Path

import requests

# ─── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).parent.parent
ASSETS_DIR = REPO_ROOT / "mobile" / "assets" / "destinations"
IMAGES_DIR = ASSETS_DIR / "images"
FALLBACKS_DIR = ASSETS_DIR / "fallbacks"
RAW_DATA = ASSETS_DIR / "destinations_raw.json"
WITH_IMAGES_DATA = ASSETS_DIR / "destinations_with_images.json"
FINAL_JSON = ASSETS_DIR / "destinations.json"
INDEX_TS = ASSETS_DIR / "index.ts"

WIKI_API = "https://en.wikipedia.org/w/api.php"

HEADERS = {
    "User-Agent": "TripPlannerBot/1.0 (educational project)",
    "Accept": "application/json",
}

# Representative Wikipedia articles for each type's fallback image
FALLBACK_ARTICLES = {
    "city":       "New York City",
    "beach":      "Maldives",
    "mountain":   "Swiss Alps",
    "nature":     "Yellowstone National Park",
    "historical": "Machu Picchu",
    "island":     "Bora Bora",
    "other":      "Santorini",
}

# How many top-ranked city destinations get a bundled photo
IMAGE_CUTOFF = 6000  # effectively "all" — covers all 5827 destinations

# ─── Curated tourist attractions (non-city destinations) ─────────────────────
# These supplement the GeoNames city data with famous natural/historical sites.

ATTRACTIONS: list[dict] = [
    # ── Nature / National Parks ──
    {"name": "Yellowstone National Park", "country": "United States", "countryCode": "US", "region": "Wyoming", "type": "nature", "lat": 44.4280, "lng": -110.5885},
    {"name": "Grand Canyon National Park", "country": "United States", "countryCode": "US", "region": "Arizona", "type": "nature", "lat": 36.1069, "lng": -112.1129},
    {"name": "Yosemite National Park", "country": "United States", "countryCode": "US", "region": "California", "type": "nature", "lat": 37.8651, "lng": -119.5383},
    {"name": "Zion National Park", "country": "United States", "countryCode": "US", "region": "Utah", "type": "nature", "lat": 37.2982, "lng": -113.0263},
    {"name": "Bryce Canyon National Park", "country": "United States", "countryCode": "US", "region": "Utah", "type": "nature", "lat": 37.5930, "lng": -112.1871},
    {"name": "Arches National Park", "country": "United States", "countryCode": "US", "region": "Utah", "type": "nature", "lat": 38.7331, "lng": -109.5925},
    {"name": "Glacier National Park", "country": "United States", "countryCode": "US", "region": "Montana", "type": "nature", "lat": 48.6962, "lng": -113.7185},
    {"name": "Olympic National Park", "country": "United States", "countryCode": "US", "region": "Washington", "type": "nature", "lat": 47.9022, "lng": -123.4108},
    {"name": "Acadia National Park", "country": "United States", "countryCode": "US", "region": "Maine", "type": "nature", "lat": 44.3386, "lng": -68.2733},
    {"name": "Great Smoky Mountains National Park", "country": "United States", "countryCode": "US", "region": "Tennessee", "type": "nature", "lat": 35.6532, "lng": -83.5070},
    {"name": "Rocky Mountain National Park", "country": "United States", "countryCode": "US", "region": "Colorado", "type": "nature", "lat": 40.3428, "lng": -105.6836},
    {"name": "Shenandoah National Park", "country": "United States", "countryCode": "US", "region": "Virginia", "type": "nature", "lat": 38.5333, "lng": -78.3500},
    {"name": "Banff National Park", "country": "Canada", "countryCode": "CA", "region": "Alberta", "type": "nature", "lat": 51.4968, "lng": -115.9281},
    {"name": "Jasper National Park", "country": "Canada", "countryCode": "CA", "region": "Alberta", "type": "nature", "lat": 52.8734, "lng": -117.9544},
    {"name": "Patagonia", "country": "Argentina", "countryCode": "AR", "region": "Santa Cruz", "type": "nature", "lat": -49.3295, "lng": -72.8865},
    {"name": "Amazon Rainforest", "country": "Brazil", "countryCode": "BR", "region": "Amazonas", "type": "nature", "lat": -3.4653, "lng": -62.2159},
    {"name": "Galápagos Islands", "country": "Ecuador", "countryCode": "EC", "region": "Galápagos", "type": "island", "lat": -0.8905, "lng": -89.6094},
    {"name": "Serengeti National Park", "country": "Tanzania", "countryCode": "TZ", "region": "Mara", "type": "nature", "lat": -2.3333, "lng": 34.8333},
    {"name": "Kruger National Park", "country": "South Africa", "countryCode": "ZA", "region": "Limpopo", "type": "nature", "lat": -23.9884, "lng": -31.5547},
    {"name": "Masai Mara", "country": "Kenya", "countryCode": "KE", "region": "Narok", "type": "nature", "lat": -1.5000, "lng": 35.1500},
    {"name": "Victoria Falls", "country": "Zimbabwe", "countryCode": "ZW", "region": "Matabeleland North", "type": "nature", "lat": -17.9243, "lng": 25.8567},
    {"name": "Zhangjiajie National Forest Park", "country": "China", "countryCode": "CN", "region": "Hunan", "type": "nature", "lat": 29.3254, "lng": 110.4347},
    {"name": "Ha Long Bay", "country": "Vietnam", "countryCode": "VN", "region": "Quảng Ninh", "type": "nature", "lat": 20.9101, "lng": 107.1839},
    {"name": "Plitvice Lakes National Park", "country": "Croatia", "countryCode": "HR", "region": "Lika-Senj", "type": "nature", "lat": 44.8654, "lng": 15.5820},
    {"name": "Fiordland National Park", "country": "New Zealand", "countryCode": "NZ", "region": "Southland", "type": "nature", "lat": -45.4153, "lng": 167.7182},
    {"name": "Torres del Paine", "country": "Chile", "countryCode": "CL", "region": "Magallanes", "type": "nature", "lat": -51.2538, "lng": -72.9906},
    {"name": "Iguazú Falls", "country": "Argentina", "countryCode": "AR", "region": "Misiones", "type": "nature", "lat": -25.6953, "lng": -54.4367},
    {"name": "Komodo National Park", "country": "Indonesia", "countryCode": "ID", "region": "East Nusa Tenggara", "type": "nature", "lat": -8.5500, "lng": 119.4900},
    {"name": "Sagarmatha National Park", "country": "Nepal", "countryCode": "NP", "region": "Koshi", "type": "nature", "lat": 27.9516, "lng": 86.6985},
    {"name": "Dolomites", "country": "Italy", "countryCode": "IT", "region": "Trentino-Alto Adige", "type": "mountain", "lat": 46.4102, "lng": 11.8440},
    # ── Mountains / Ski Resorts ──
    {"name": "Swiss Alps", "country": "Switzerland", "countryCode": "CH", "region": "Valais", "type": "mountain", "lat": 46.5584, "lng": 8.0808},
    {"name": "Zermatt", "country": "Switzerland", "countryCode": "CH", "region": "Valais", "type": "mountain", "lat": 46.0207, "lng": 7.7491},
    {"name": "Chamonix", "country": "France", "countryCode": "FR", "region": "Auvergne-Rhône-Alpes", "type": "mountain", "lat": 45.9237, "lng": 6.8694},
    {"name": "Innsbruck", "country": "Austria", "countryCode": "AT", "region": "Tyrol", "type": "mountain", "lat": 47.2692, "lng": 11.4041},
    {"name": "Queenstown", "country": "New Zealand", "countryCode": "NZ", "region": "Otago", "type": "mountain", "lat": -45.0312, "lng": 168.6626},
    {"name": "Aspen", "country": "United States", "countryCode": "US", "region": "Colorado", "type": "mountain", "lat": 39.1911, "lng": -106.8175},
    {"name": "Whistler", "country": "Canada", "countryCode": "CA", "region": "British Columbia", "type": "mountain", "lat": 50.1163, "lng": -122.9574},
    {"name": "Himalayas", "country": "Nepal", "countryCode": "NP", "region": "Gandaki", "type": "mountain", "lat": 28.5984, "lng": 83.9560},
    {"name": "Patagonia Torres del Paine", "country": "Chile", "countryCode": "CL", "region": "Magallanes", "type": "mountain", "lat": -50.9423, "lng": -73.4068},
    # ── Beaches ──
    {"name": "Maldives", "country": "Maldives", "countryCode": "MV", "region": "South Malé Atoll", "type": "beach", "lat": 3.2028, "lng": 73.2207},
    {"name": "Bali", "country": "Indonesia", "countryCode": "ID", "region": "Bali", "type": "beach", "lat": -8.3405, "lng": 115.0920},
    {"name": "Phuket", "country": "Thailand", "countryCode": "TH", "region": "Phuket", "type": "beach", "lat": 7.8804, "lng": 98.3923},
    {"name": "Maui", "country": "United States", "countryCode": "US", "region": "Hawaii", "type": "beach", "lat": 20.7984, "lng": -156.3319},
    {"name": "Waikiki Beach", "country": "United States", "countryCode": "US", "region": "Hawaii", "type": "beach", "lat": 21.2793, "lng": -157.8294},
    {"name": "Cancún", "country": "Mexico", "countryCode": "MX", "region": "Quintana Roo", "type": "beach", "lat": 21.1619, "lng": -86.8515},
    {"name": "Tulum", "country": "Mexico", "countryCode": "MX", "region": "Quintana Roo", "type": "beach", "lat": 20.2114, "lng": -87.4654},
    {"name": "Copacabana Beach", "country": "Brazil", "countryCode": "BR", "region": "Rio de Janeiro", "type": "beach", "lat": -22.9711, "lng": -43.1822},
    {"name": "Santorini", "country": "Greece", "countryCode": "GR", "region": "South Aegean", "type": "island", "lat": 36.3932, "lng": 25.4615},
    {"name": "Mykonos", "country": "Greece", "countryCode": "GR", "region": "South Aegean", "type": "island", "lat": 37.4467, "lng": 25.3289},
    {"name": "Ibiza", "country": "Spain", "countryCode": "ES", "region": "Balearic Islands", "type": "beach", "lat": 38.9067, "lng": 1.4206},
    {"name": "Côte d'Azur", "country": "France", "countryCode": "FR", "region": "Provence-Alpes-Côte d'Azur", "type": "beach", "lat": 43.7034, "lng": 7.2663},
    {"name": "Amalfi Coast", "country": "Italy", "countryCode": "IT", "region": "Campania", "type": "beach", "lat": 40.6340, "lng": 14.6027},
    {"name": "Cinque Terre", "country": "Italy", "countryCode": "IT", "region": "Liguria", "type": "beach", "lat": 44.1274, "lng": 9.7150},
    {"name": "Algarve", "country": "Portugal", "countryCode": "PT", "region": "Faro", "type": "beach", "lat": 37.0194, "lng": -8.1328},
    {"name": "Krabi", "country": "Thailand", "countryCode": "TH", "region": "Krabi", "type": "beach", "lat": 8.0863, "lng": 98.9063},
    {"name": "Boracay", "country": "Philippines", "countryCode": "PH", "region": "Western Visayas", "type": "beach", "lat": 11.9674, "lng": 121.9248},
    {"name": "Palawan", "country": "Philippines", "countryCode": "PH", "region": "Mimaropa", "type": "beach", "lat": 9.8349, "lng": 118.7384},
    {"name": "Whitsundays", "country": "Australia", "countryCode": "AU", "region": "Queensland", "type": "beach", "lat": -20.2695, "lng": 148.8795},
    {"name": "Zanzibar", "country": "Tanzania", "countryCode": "TZ", "region": "Zanzibar", "type": "island", "lat": -6.1659, "lng": 39.2026},
    # ── Islands ──
    {"name": "Bora Bora", "country": "French Polynesia", "countryCode": "PF", "region": "Leeward Islands", "type": "island", "lat": -16.5004, "lng": -151.7415},
    {"name": "Fiji", "country": "Fiji", "countryCode": "FJ", "region": "Central Division", "type": "island", "lat": -17.7134, "lng": 178.0650},
    {"name": "Seychelles", "country": "Seychelles", "countryCode": "SC", "region": "Mahé", "type": "island", "lat": -4.6796, "lng": 55.4920},
    {"name": "Azores", "country": "Portugal", "countryCode": "PT", "region": "Azores", "type": "island", "lat": 37.7412, "lng": -25.6756},
    {"name": "Madeira", "country": "Portugal", "countryCode": "PT", "region": "Madeira", "type": "island", "lat": 32.6669, "lng": -16.9241},
    {"name": "Canary Islands", "country": "Spain", "countryCode": "ES", "region": "Canary Islands", "type": "island", "lat": 28.2916, "lng": -16.6291},
    {"name": "Maldives Atolls", "country": "Maldives", "countryCode": "MV", "region": "North Malé Atoll", "type": "island", "lat": 4.1755, "lng": 73.5093},
    {"name": "Sri Lanka", "country": "Sri Lanka", "countryCode": "LK", "region": "Western Province", "type": "island", "lat": 7.8731, "lng": 80.7718},
    {"name": "Caribbean Islands", "country": "Barbados", "countryCode": "BB", "region": "Saint Michael", "type": "island", "lat": 13.1939, "lng": -59.5432},
    {"name": "Balearic Islands", "country": "Spain", "countryCode": "ES", "region": "Balearic Islands", "type": "island", "lat": 39.6953, "lng": 3.0176},
    # ── Historical / Cultural ──
    {"name": "Machu Picchu", "country": "Peru", "countryCode": "PE", "region": "Cusco", "type": "historical", "lat": -13.1631, "lng": -72.5450},
    {"name": "Angkor Wat", "country": "Cambodia", "countryCode": "KH", "region": "Siem Reap", "type": "historical", "lat": 13.4125, "lng": 103.8670},
    {"name": "Petra", "country": "Jordan", "countryCode": "JO", "region": "Ma'an", "type": "historical", "lat": 30.3285, "lng": 35.4444},
    {"name": "Colosseum", "country": "Italy", "countryCode": "IT", "region": "Lazio", "type": "historical", "lat": 41.8902, "lng": 12.4922},
    {"name": "Acropolis of Athens", "country": "Greece", "countryCode": "GR", "region": "Attica", "type": "historical", "lat": 37.9715, "lng": 23.7267},
    {"name": "Taj Mahal", "country": "India", "countryCode": "IN", "region": "Uttar Pradesh", "type": "historical", "lat": 27.1751, "lng": 78.0421},
    {"name": "Great Wall of China", "country": "China", "countryCode": "CN", "region": "Beijing", "type": "historical", "lat": 40.4319, "lng": 116.5704},
    {"name": "Chichén Itzá", "country": "Mexico", "countryCode": "MX", "region": "Yucatán", "type": "historical", "lat": 20.6843, "lng": -88.5678},
    {"name": "Stonehenge", "country": "United Kingdom", "countryCode": "GB", "region": "Wiltshire", "type": "historical", "lat": 51.1789, "lng": -1.8262},
    {"name": "Pyramids of Giza", "country": "Egypt", "countryCode": "EG", "region": "Giza", "type": "historical", "lat": 29.9792, "lng": 31.1342},
    {"name": "Pompeii", "country": "Italy", "countryCode": "IT", "region": "Campania", "type": "historical", "lat": 40.7509, "lng": 14.4989},
    {"name": "Alhambra", "country": "Spain", "countryCode": "ES", "region": "Andalusia", "type": "historical", "lat": 37.1760, "lng": -3.5880},
    {"name": "Mont Saint-Michel", "country": "France", "countryCode": "FR", "region": "Normandy", "type": "historical", "lat": 48.6361, "lng": -1.5115},
    {"name": "Versailles", "country": "France", "countryCode": "FR", "region": "Île-de-France", "type": "historical", "lat": 48.8049, "lng": 2.1204},
    {"name": "Ephesus", "country": "Turkey", "countryCode": "TR", "region": "İzmir", "type": "historical", "lat": 37.9395, "lng": 27.3417},
    {"name": "Tikal", "country": "Guatemala", "countryCode": "GT", "region": "Petén", "type": "historical", "lat": 17.2220, "lng": -89.6237},
    {"name": "Bagan", "country": "Myanmar", "countryCode": "MM", "region": "Mandalay", "type": "historical", "lat": 21.1717, "lng": 94.8585},
    {"name": "Borobudur", "country": "Indonesia", "countryCode": "ID", "region": "Central Java", "type": "historical", "lat": -7.6079, "lng": 110.2038},
    {"name": "Luxor", "country": "Egypt", "countryCode": "EG", "region": "Luxor", "type": "historical", "lat": 25.6872, "lng": 32.6396},
    {"name": "Cappadocia", "country": "Turkey", "countryCode": "TR", "region": "Nevşehir", "type": "historical", "lat": 38.6439, "lng": 34.8289},
    {"name": "Dubrovnik Old Town", "country": "Croatia", "countryCode": "HR", "region": "Dubrovnik-Neretva", "type": "historical", "lat": 42.6507, "lng": 18.0944},
    {"name": "Hallstatt", "country": "Austria", "countryCode": "AT", "region": "Upper Austria", "type": "historical", "lat": 47.5623, "lng": 13.6493},
    {"name": "Rothenburg ob der Tauber", "country": "Germany", "countryCode": "DE", "region": "Bavaria", "type": "historical", "lat": 49.3774, "lng": 10.1797},
    {"name": "Ronda", "country": "Spain", "countryCode": "ES", "region": "Andalusia", "type": "historical", "lat": 36.7469, "lng": -5.1616},
    {"name": "Sintra", "country": "Portugal", "countryCode": "PT", "region": "Lisbon", "type": "historical", "lat": 38.7976, "lng": -9.3906},
]


# ─── Helpers ──────────────────────────────────────────────────────────────────


def slugify(name: str) -> str:
    s = name.lower()
    for src, dst in [
        ("àáâãäå", "a"), ("èéêë", "e"), ("ìíîï", "i"),
        ("òóôõöø", "o"), ("ùúûü", "u"), ("ñ", "n"), ("ç", "c"),
        ("ý", "y"), ("ß", "ss"), ("'", ""),
    ]:
        for ch in src:
            s = s.replace(ch, dst)
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s[:60].rstrip("-") or "unknown"


def get_thumbnail_url(title: str, size: int = 800) -> str | None:
    try:
        resp = requests.get(
            WIKI_API,
            params={
                "action": "query",
                "titles": title,
                "prop": "pageimages",
                "pithumbsize": size,
                "format": "json",
                "formatversion": 2,
            },
            headers=HEADERS,
            timeout=15,
        )
        pages = resp.json().get("query", {}).get("pages", [])
        if pages and "thumbnail" in pages[0]:
            return pages[0]["thumbnail"]["source"]
    except Exception:
        pass
    return None


def download_image(url: str, dest_path: Path, retries: int = 4) -> bool:
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30, stream=True)
            if resp.status_code == 429:
                wait = 15 * (attempt + 1)
                print(f"    Rate limited, waiting {wait}s…")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            ct = resp.headers.get("content-type", "")
            if "image/" not in ct:
                return False
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            with open(dest_path, "wb") as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            if dest_path.stat().st_size < 15_000:
                dest_path.unlink()
                return False
            return True
        except Exception as e:
            print(f"    Download error: {e}")
            if attempt < retries - 1:
                time.sleep(5)
    return False


# ─── Phase 1: Fetch destination data ─────────────────────────────────────────
# Uses the GeoNames cities5000 data dump (free, no API key needed).
# Cities with population > 5000 are downloaded, filtered to top 5000 worldwide
# and top 1000 US, then merged with the curated ATTRACTIONS list above.


GEONAMES_URL = "https://download.geonames.org/export/dump/cities5000.zip"

# GeoNames feature codes → destination type
FEATURE_TYPE_MAP = {
    "PPLC": "city",   # capital of political entity
    "PPLA": "city",   # seat of admin div 1
    "PPLA2": "city",  # seat of admin div 2
    "PPLA3": "city",
    "PPLA4": "city",
    "PPL": "city",
    "PPLX": "city",
    "PPLG": "city",
    "PPLL": "city",
    "PPLF": "city",
    "PPLR": "city",
    "PPLS": "city",
}


def fetch_data():
    print("=== Phase 1: Fetching destination data ===\n")
    print(f"Downloading GeoNames cities5000 dump...")
    resp = requests.get(GEONAMES_URL, headers=HEADERS, timeout=120, stream=True)
    resp.raise_for_status()
    raw_bytes = resp.content
    print(f"  Downloaded {len(raw_bytes) // 1024}KB")

    with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
        with zf.open("cities5000.txt") as f:
            lines = f.read().decode("utf-8").splitlines()

    print(f"  Parsing {len(lines)} city records...")

    cities: list[dict] = []
    for line in lines:
        cols = line.split("\t")
        if len(cols) < 15:
            continue
        try:
            gid = cols[0]
            name = cols[1]          # UTF-8 name
            ascii_name = cols[2]    # ASCII name (fallback)
            lat = float(cols[4])
            lng = float(cols[5])
            feature_code = cols[7]
            country_code = cols[8]
            admin1 = cols[10]       # state/province code (not name)
            population = int(cols[14]) if cols[14] else 0
        except (ValueError, IndexError):
            continue

        if not name or population == 0:
            continue

        dest_type = FEATURE_TYPE_MAP.get(feature_code, "city")
        cities.append({
            "_id": f"gn-{gid}",
            "name": name,
            "asciiName": ascii_name,
            "country": "",           # filled in below
            "countryCode": country_code,
            "region": None,          # admin1 code; names resolved later
            "type": dest_type,
            "coordinates": {"lat": round(lat, 4), "lng": round(lng, 4)},
            "population": population,
        })

    # Sort by population desc
    cities.sort(key=lambda d: -d["population"])

    # Load country names from GeoNames country info (bundled in same dump)
    print("  Loading country names...")
    country_url = "https://download.geonames.org/export/dump/countryInfo.txt"
    country_names: dict[str, str] = {}
    try:
        cr = requests.get(country_url, headers=HEADERS, timeout=30)
        for line in cr.text.splitlines():
            if line.startswith("#") or not line.strip():
                continue
            cols = line.split("\t")
            if len(cols) >= 5:
                country_names[cols[0]] = cols[4]  # ISO2 → Country name
    except Exception as e:
        print(f"  Warning: could not load country names: {e}")

    for c in cities:
        c["country"] = country_names.get(c["countryCode"], c["countryCode"])
        del c["asciiName"]

    # Take top 5000 worldwide (already sorted by pop) + ensure top 1000 US
    worldwide_top5000 = cities[:5000]
    seen_ids = {d["_id"] for d in worldwide_top5000}

    us_cities = [c for c in cities if c["countryCode"] == "US"]
    for c in us_cities[:1000]:
        if c["_id"] not in seen_ids:
            worldwide_top5000.append(c)
            seen_ids.add(c["_id"])

    destinations = worldwide_top5000

    # Add curated tourist attractions
    attraction_id = 10000
    for attr in ATTRACTIONS:
        destinations.append({
            "_id": f"attr-{attraction_id}",
            "name": attr["name"],
            "country": attr["country"],
            "countryCode": attr["countryCode"],
            "region": attr.get("region"),
            "type": attr["type"],
            "coordinates": {"lat": attr["lat"], "lng": attr["lng"]},
            "population": 0,  # used for ranking; attractions go after cities
        })
        attraction_id += 1

    # Re-sort: cities by population, then attractions (pop=0) at end
    destinations.sort(key=lambda d: -d["population"])

    # Assign globalRank
    for i, d in enumerate(destinations):
        d["globalRank"] = i + 1

    # Assign usRank
    us_rank = 1
    for d in destinations:
        if d["countryCode"] == "US":
            d["usRank"] = us_rank
            us_rank += 1
        else:
            d["usRank"] = None

    total = len(destinations)
    us_count = sum(1 for d in destinations if d["countryCode"] == "US")
    by_type: dict[str, int] = {}
    for d in destinations:
        by_type[d["type"]] = by_type.get(d["type"], 0) + 1

    print(f"\nTotal destinations: {total} (US: {us_count})")
    for t, c in sorted(by_type.items()):
        print(f"  {t}: {c}")

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DATA.write_text(json.dumps(destinations, ensure_ascii=False, indent=2))
    print(f"\nSaved → {RAW_DATA}")


# ─── Phase 2: Download images ─────────────────────────────────────────────────


def download_images():
    print("=== Phase 2: Downloading destination images ===\n")

    if not RAW_DATA.exists():
        print(f"ERROR: {RAW_DATA} not found. Run --phase fetch-data first.")
        return

    destinations = json.loads(RAW_DATA.read_text())
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    FALLBACKS_DIR.mkdir(parents=True, exist_ok=True)

    # --- Fallback images first ---
    print("Downloading type fallback images...")
    for dest_type, article in FALLBACK_ARTICLES.items():
        path = FALLBACKS_DIR / f"{dest_type}.jpg"
        if path.exists():
            print(f"  [skip] {dest_type}.jpg")
            continue
        url = get_thumbnail_url(article, 800)
        if url:
            ok = download_image(url, path)
            print(f"  {'[ok]  ' if ok else '[FAIL]'} {dest_type}.jpg  ({article})")
        else:
            print(f"  [FAIL] no thumbnail for {article}")
        time.sleep(2)  # respectful delay between fallback downloads

    # --- Destination images ---
    to_download = [d for d in destinations if d["globalRank"] <= IMAGE_CUTOFF or d["type"] != "city"]
    print(f"\nDownloading images for {len(to_download)} destinations (top {IMAGE_CUTOFF} cities + all non-city attractions)...")

    ok_count = 0
    for i, dest in enumerate(to_download, 1):
        slug = slugify(dest["name"])
        path = IMAGES_DIR / f"{slug}.jpg"

        if path.exists():
            dest["image"] = slug
            ok_count += 1
            continue

        # Use destination name directly as Wikipedia article title
        title = dest["name"]
        url = get_thumbnail_url(title, 800)
        if not url:
            dest["image"] = None
            time.sleep(0.2)
            continue

        ok = download_image(url, path)
        dest["image"] = slug if ok else None
        if ok:
            ok_count += 1

        if i % 25 == 0:
            print(f"  {i}/{len(to_download)} processed, {ok_count} downloaded")
            # Incremental save so a kill doesn't lose all progress
            for dest in destinations:
                if "image" not in dest:
                    dest["image"] = None
            WITH_IMAGES_DATA.write_text(json.dumps(destinations, ensure_ascii=False, indent=2))
        time.sleep(1.5)  # respectful delay; Wikipedia rate-limits aggressive scrapers

    for dest in destinations:
        if "image" not in dest:
            dest["image"] = None

    print(f"\nDownloaded {ok_count} destination images")
    WITH_IMAGES_DATA.write_text(json.dumps(destinations, ensure_ascii=False, indent=2))
    print(f"Saved → {WITH_IMAGES_DATA}")


# ─── Phase 3: Generate index ──────────────────────────────────────────────────


def generate_index():
    print("=== Phase 3: Generating destinations.json + index.ts ===\n")

    src = WITH_IMAGES_DATA if WITH_IMAGES_DATA.exists() else RAW_DATA
    if not src.exists():
        print("ERROR: No data file found. Run --phase fetch-data first.")
        return

    raw = json.loads(src.read_text())

    output = []
    for d in raw:
        image_val = d.get("image")
        if image_val and not (IMAGES_DIR / f"{image_val}.jpg").exists():
            image_val = None
        output.append({
            "id": d.get("_id") or d.get("id", ""),
            "name": d["name"],
            "country": d["country"],
            "countryCode": d["countryCode"],
            "region": d.get("region"),
            "type": d["type"],
            "coordinates": d["coordinates"],
            "globalRank": d["globalRank"],
            "usRank": d.get("usRank"),
            "image": image_val,
        })

    FINAL_JSON.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")))
    print(f"Wrote {len(output)} destinations → {FINAL_JSON}")

    image_slugs = sorted(p.stem for p in IMAGES_DIR.glob("*.jpg"))
    fallback_types = sorted(p.stem for p in FALLBACKS_DIR.glob("*.jpg"))

    lines = [
        "// AUTO-GENERATED by scripts/generate_destinations.py — do not edit",
        "",
        "export function getImage(slug: string | null): number | null {",
        "  switch (slug) {",
    ]
    for slug in image_slugs:
        lines.append(f"    case '{slug}': return require('./images/{slug}.jpg');")
    lines += ["    default: return null;", "  }", "}", ""]

    lines += [
        "export function getFallback(type: string): number | null {",
        "  switch (type) {",
    ]
    for t in fallback_types:
        lines.append(f"    case '{t}': return require('./fallbacks/{t}.jpg');")
    lines += ["    default: return null;", "  }", "}"]

    INDEX_TS.write_text("\n".join(lines) + "\n")
    print(f"Wrote index.ts: {len(image_slugs)} images + {len(fallback_types)} fallbacks")

    with_img = sum(1 for d in output if d["image"])
    us_count = sum(1 for d in output if d["countryCode"] == "US")
    print(f"\nStats: total={len(output)}, with_image={with_img}, us={us_count}")
    by_type: dict[str, int] = {}
    for d in output:
        by_type[d["type"]] = by_type.get(d["type"], 0) + 1
    for t, c in sorted(by_type.items()):
        print(f"  {t}: {c}")


# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--phase",
        choices=["fetch-data", "download-images", "generate-index", "all"],
        required=True,
    )
    args = parser.parse_args()

    if args.phase in ("fetch-data", "all"):
        fetch_data()
    if args.phase in ("download-images", "all"):
        download_images()
    if args.phase in ("generate-index", "all"):
        generate_index()
