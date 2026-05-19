import re
from datetime import datetime

from dateutil import parser as dateutil_parser

from app.models.plan import PlanType

_TYPE_KEYWORDS: dict[PlanType, list[str]] = {
    PlanType.Flight: ["flight", "airline", "boarding", "departure gate", "arrival airport", "operated by"],
    PlanType.Hotel: ["hotel", "check-in", "check-out", "checkout", "checkin", "room", "property", "resort", "inn"],
    PlanType.CarReservation: ["car rental", "rental car", "rental", "pickup location", "dropoff", "vehicle", "driver"],
    PlanType.Tour: ["tour", "excursion", "guide", "meeting point", "group size"],
    PlanType.Cruise: ["cruise", "ship", "cabin", "embarkation", "port of call", "cruise line"],
    PlanType.Ferry: ["ferry", "vessel", "crossing", "departure port", "arrival port"],
    PlanType.RailwayRide: ["train", "railway", "rail", "platform", "station", "coach", "railpass"],
    PlanType.BusRide: ["bus", "motorcoach", "bus terminal", "greyhound", "flixbus", "megabus"],
    PlanType.LocalEvent: ["event", "venue", "ticket", "concert", "show", "performance", "festival", "exhibition"],
}

# Multi-phrase keywords score higher than single words
_KEYWORD_WEIGHT: dict[PlanType, dict[str, int]] = {
    PlanType.Flight: {"departure gate": 3, "arrival airport": 3, "boarding": 2, "airline": 2, "flight": 1},
    PlanType.Hotel: {"check-in": 3, "check-out": 3, "checkout": 2, "checkin": 2, "hotel": 2, "room": 1},
    PlanType.CarReservation: {"car rental": 3, "rental car": 3, "pickup location": 2, "dropoff": 2, "rental": 1},
    PlanType.Tour: {"meeting point": 3, "group size": 2, "excursion": 2, "tour": 1},
    PlanType.Cruise: {"cruise line": 3, "port of call": 3, "embarkation": 3, "cabin": 2, "cruise": 1},
    PlanType.Ferry: {"departure port": 3, "arrival port": 3, "ferry": 2, "vessel": 2, "crossing": 1},
    PlanType.RailwayRide: {"railway": 3, "railpass": 3, "platform": 2, "station": 2, "train": 1},
    PlanType.BusRide: {"bus terminal": 3, "motorcoach": 3, "greyhound": 3, "flixbus": 3, "megabus": 3, "bus": 1},
    PlanType.LocalEvent: {"concert": 3, "performance": 3, "festival": 3, "exhibition": 3, "venue": 2, "ticket": 2, "show": 1, "event": 1},
}


def _detect_type(text: str) -> PlanType:
    lower = text.lower()
    scores: dict[PlanType, int] = {}
    for plan_type, weights in _KEYWORD_WEIGHT.items():
        scores[plan_type] = sum(w for kw, w in weights.items() if kw in lower)
    best_type = max(scores, key=lambda t: scores[t])
    if scores[best_type] == 0:
        raise ValueError("Could not detect plan type from the provided text")
    return best_type


def _first_match(pattern: str, text: str, flags: int = re.IGNORECASE) -> str | None:
    m = re.search(pattern, text, flags)
    return m.group(1).strip() if m else None


_MONTHS = (
    r'(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
    r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
)

# (?!\d) prevents matching leading digits of a year (e.g. "20" from "2026")
_DATE_RE = re.compile(
    r'\b' + _MONTHS + r'\s+\d{1,2}(?!\d)(?:,?\s*\d{4})?'   # Jun 16, 2026 / June 16 2026
    r'|\b\d{1,2}(?!\d)\s+' + _MONTHS + r'(?:,?\s*\d{4})?'   # 16 Jun 2026 / 16 June 2026
    r'|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'                    # 06/16/2026
    r'|\b\d{4}-\d{2}-\d{2}\b',                                # 2026-06-16
    re.IGNORECASE,
)


def _extract_dates(text: str) -> tuple[datetime | None, datetime | None]:
    """Return up to two dates found in text as (start, end). Uses fuzzy dateutil parsing."""
    raw_dates = _DATE_RE.findall(text)
    parsed: list[datetime] = []
    for raw in raw_dates:
        try:
            parsed.append(dateutil_parser.parse(raw, fuzzy=True))
        except (ValueError, OverflowError):
            pass
    parsed = sorted(set(parsed))
    start = parsed[0] if len(parsed) > 0 else None
    end = parsed[1] if len(parsed) > 1 else None
    return start, end


# ── Field extractors ────────────────────────────────────────────────────────

def _extract_flight(text: str) -> tuple[str, dict]:
    flight_number = _first_match(r'\b([A-Z]{2}\s?\d{3,4})\b', text, re.ASCII)
    confirmation = _first_match(
        r'(?:confirmation|booking|record\s+locator|pnr)[^\w\n]*([A-Z0-9]{5,8})\b', text
    )
    # Airport codes: look for 3-letter uppercase codes near from/depart and to/arrive
    dep_airport = _first_match(r'(?:from|departs?|departing|origin)[^\w]*\b([A-Z]{3})\b', text)
    arr_airport = _first_match(r'(?:to|arrives?|arriving|destination)[^\w]*\b([A-Z]{3})\b', text)
    # Fallback: grab all 3-letter airport codes in order
    if not dep_airport or not arr_airport:
        airports = re.findall(r'\b([A-Z]{3})\b', text, re.ASCII)
        # Filter out non-airport-looking codes (common words like THE, AND, etc.)
        common = {"THE", "AND", "FOR", "YOU", "ARE", "NOT", "BUT", "HAS", "ITS"}
        airports = [a for a in airports if a not in common]
        if not dep_airport and len(airports) > 0:
            dep_airport = airports[0]
        if not arr_airport and len(airports) > 1:
            arr_airport = airports[1]

    airline = _first_match(r'(?:airline|operated by|carrier)[:\s]+([A-Za-z\s]+?)(?:\n|,|\.|$)', text)
    seat = _first_match(r'seat[:\s]+([A-Z0-9]+)', text)
    terminal = _first_match(r'terminal[:\s]+([A-Z0-9]+)', text)
    gate = _first_match(r'gate[:\s]+([A-Z0-9]+)', text)
    cabin_class = _first_match(r'\b(economy|business|first\s+class|premium\s+economy)\b', text)

    parts = [p for p in [airline, flight_number, dep_airport, arr_airport] if p]
    if dep_airport and arr_airport:
        title = f"{(' '.join([airline, flight_number]) if airline and flight_number else flight_number or 'Flight')} {dep_airport} → {arr_airport}"
    else:
        title = " ".join(parts) if parts else "Flight"

    return title, {
        "airline": airline,
        "flight_number": flight_number,
        "confirmation": confirmation,
        "departure_airport": dep_airport,
        "arrival_airport": arr_airport,
        "seat": seat,
        "terminal": terminal,
        "gate": gate,
        "cabin_class": cabin_class,
    }


def _extract_hotel(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reservation)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    room_type = _first_match(r'\b(king|queen|double|twin|suite|deluxe|standard)\b(?:\s+\w+)?\s*(?:room|bed|suite)?', text)
    loyalty_number = _first_match(r'(?:loyalty|rewards?|member(?:ship)?)\s*(?:number|no\.?|#)[:\s]*([A-Z0-9\-]+)', text)
    # Try to extract property name: first capitalised line containing "hotel", "inn", "resort", "lodge"
    name_match = re.search(r'^([A-Z][^\n]{3,60}(?:Hotel|Inn|Resort|Lodge|Suites?|Hostel)[^\n]*)', text, re.MULTILINE)
    title = name_match.group(1).strip() if name_match else "Hotel stay"

    return title, {"confirmation": confirmation, "room_type": room_type, "loyalty_number": loyalty_number}


def _extract_car(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reservation)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    rental_company = _first_match(
        r'\b(Enterprise|Hertz|Avis|Budget|Alamo|National|Dollar|Thrifty|Sixt|Europcar|Zipcar)\b', text
    )
    car_type = _first_match(r'\b(compact|economy|midsize|full.?size|SUV|minivan|convertible|luxury|sedan|truck)\b', text)
    pickup_location = _first_match(r'(?:pickup|pick-up)\s*(?:location|address)?[:\s]+([^\n]+)', text)
    dropoff_location = _first_match(r'(?:dropoff|drop-off|return)\s*(?:location|address)?[:\s]+([^\n]+)', text)
    driver_name = _first_match(r'(?:driver|renter|name)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', text)

    title = f"{rental_company} rental" if rental_company else "Car rental"
    return title, {
        "rental_company": rental_company,
        "confirmation": confirmation,
        "car_type": car_type,
        "pickup_location": pickup_location,
        "dropoff_location": dropoff_location,
        "driver_name": driver_name,
    }


def _extract_tour(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reference)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    operator = _first_match(r'(?:operator|tour\s+company|provider)[:\s]+([^\n,]+)', text)
    meeting_point = _first_match(r'(?:meeting\s+point|meet\s+at|meet\s+us\s+at)[:\s]+([^\n]+)', text)
    group_size_raw = _first_match(r'(\d+)\s*(?:people|guests?|pax|participants?)', text)
    group_size = int(group_size_raw) if group_size_raw and group_size_raw.isdigit() else None
    includes_raw = _first_match(r'(?:includes?|included)[:\s]+([^\n]+)', text)
    includes = [i.strip() for i in includes_raw.split(",")] if includes_raw else []

    title = operator if operator else "Tour"
    return title, {
        "operator": operator,
        "confirmation": confirmation,
        "meeting_point": meeting_point,
        "group_size": group_size,
        "includes": includes,
    }


def _extract_cruise(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reservation)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    cruise_line = _first_match(
        r'\b(Royal Caribbean|Carnival|Norwegian|MSC|Celebrity|Princess|Holland America|Disney|Cunard|Viking)\b', text
    )
    ship_name = _first_match(r'(?:ship|vessel)[:\s]+([^\n,]+)', text)
    cabin_number = _first_match(r'(?:cabin|stateroom)\s*(?:number|no\.?|#)?[:\s]*([A-Z0-9]+)', text)
    cabin_class = _first_match(r'\b(interior|ocean\s*view|balcony|suite|mini.?suite)\b', text)
    port_of_departure = _first_match(r'(?:embark(?:ation)?|departs?\s+from|port\s+of\s+departure)[:\s]+([^\n,]+)', text)
    port_of_arrival = _first_match(r'(?:disembark(?:ation)?|arrives?\s+at|port\s+of\s+arrival)[:\s]+([^\n,]+)', text)

    title = f"{cruise_line} cruise" if cruise_line else "Cruise"
    return title, {
        "cruise_line": cruise_line,
        "ship_name": ship_name,
        "confirmation": confirmation,
        "cabin_number": cabin_number,
        "cabin_class": cabin_class,
        "port_of_departure": port_of_departure,
        "port_of_arrival": port_of_arrival,
    }


def _extract_ferry(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reference)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    operator = _first_match(r'(?:operator|ferry\s+company|provider)[:\s]+([^\n,]+)', text)
    departure_port = _first_match(r'(?:departure\s+port|from\s+port|departs?\s+from)[:\s]+([^\n,]+)', text)
    arrival_port = _first_match(r'(?:arrival\s+port|to\s+port|arrives?\s+at)[:\s]+([^\n,]+)', text)
    vessel_name = _first_match(r'(?:vessel|ship|ferry)[:\s]+([^\n,]+)', text)
    seat_class = _first_match(r'\b(economy|business|first\s+class|club|premium)\b', text)

    if departure_port and arrival_port:
        title = f"Ferry {departure_port} → {arrival_port}"
    elif operator:
        title = f"{operator} ferry"
    else:
        title = "Ferry"

    return title, {
        "operator": operator,
        "confirmation": confirmation,
        "departure_port": departure_port,
        "arrival_port": arrival_port,
        "vessel_name": vessel_name,
        "seat_class": seat_class,
    }


def _extract_railway(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reference|ticket)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    operator = _first_match(
        r'\b(Amtrak|Eurostar|TGV|Shinkansen|Deutsche Bahn|Renfe|Trenitalia|VIA Rail|Avanti|LNER|CrossCountry)\b', text
    )
    train_number = _first_match(r'\b(?:train|service)\s*(?:number|no\.?|#)?[:\s]*([A-Z0-9\s]{2,10})\b', text)
    departure_station = _first_match(r'(?:departs?\s+from|from\s+station|origin)[:\s]+([^\n,]+)', text)
    arrival_station = _first_match(r'(?:arrives?\s+at|to\s+station|destination)[:\s]+([^\n,]+)', text)
    car_number = _first_match(r'(?:car|carriage|coach)\s*(?:number|no\.?|#)?[:\s]*([A-Z0-9]+)', text)
    seat = _first_match(r'seat[:\s]+([A-Z0-9]+)', text)
    cabin_class = _first_match(r'\b(economy|business|first\s+class|standard|premium)\b', text)

    if operator and departure_station and arrival_station:
        title = f"{operator} {departure_station} → {arrival_station}"
    elif operator:
        title = f"{operator} train"
    else:
        title = "Train ride"

    return title, {
        "operator": operator,
        "train_number": train_number,
        "confirmation": confirmation,
        "departure_station": departure_station,
        "arrival_station": arrival_station,
        "car_number": car_number,
        "seat": seat,
        "cabin_class": cabin_class,
    }


def _extract_bus(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|reference|ticket)[^\w\n]*([A-Z0-9]{5,10})\b', text)
    operator = _first_match(
        r'\b(Greyhound|FlixBus|Megabus|Trailways|Peter Pan|BoltBus|OurBus|RedCoach)\b', text
    )
    departure_terminal = _first_match(r'(?:departs?\s+from|from\s+terminal|boarding\s+at)[:\s]+([^\n,]+)', text)
    arrival_terminal = _first_match(r'(?:arrives?\s+at|to\s+terminal|drop.?off\s+at)[:\s]+([^\n,]+)', text)
    seat = _first_match(r'seat[:\s]+([A-Z0-9]+)', text)

    title = f"{operator} bus" if operator else "Bus ride"
    return title, {
        "operator": operator,
        "confirmation": confirmation,
        "departure_terminal": departure_terminal,
        "arrival_terminal": arrival_terminal,
        "seat": seat,
    }


def _extract_local_event(text: str) -> tuple[str, dict]:
    confirmation = _first_match(r'(?:confirmation|booking|order|ticket)[^\w\n]*(?:number|no\.?|#)?[^\w\n]*([A-Z0-9]{5,12})\b', text)
    venue = _first_match(r'(?:venue|location|at)[:\s]+([^\n,]+)', text)
    seat = _first_match(r'seat[:\s]+([^\n,]+)', text)
    event_type = _first_match(r'\b(concert|festival|show|exhibition|conference|play|opera|comedy|sports|game|match)\b', text)
    # Try to grab event name from the first prominent capitalised line
    name_match = re.search(r'^([A-Z][^\n]{5,80})$', text, re.MULTILINE)
    title = name_match.group(1).strip() if name_match else "Local event"

    return title, {
        "venue": venue,
        "confirmation": confirmation,
        "seat": seat,
        "event_type": event_type,
    }


_EXTRACTORS = {
    PlanType.Flight: _extract_flight,
    PlanType.Hotel: _extract_hotel,
    PlanType.CarReservation: _extract_car,
    PlanType.Tour: _extract_tour,
    PlanType.Cruise: _extract_cruise,
    PlanType.Ferry: _extract_ferry,
    PlanType.RailwayRide: _extract_railway,
    PlanType.BusRide: _extract_bus,
    PlanType.LocalEvent: _extract_local_event,
}


def parse_confirmation_text(raw_text: str) -> tuple[PlanType, str, datetime | None, datetime | None, dict]:
    """Detect plan type, extract fields and dates from confirmation text.

    Returns (plan_type, title, start_datetime, end_datetime, details_dict).
    Raises ValueError if the text cannot be classified.
    """
    plan_type = _detect_type(raw_text)
    extractor = _EXTRACTORS[plan_type]
    title, details = extractor(raw_text)
    start_dt, end_dt = _extract_dates(raw_text)
    return plan_type, title, start_dt, end_dt, details
