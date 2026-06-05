# Known Issues

## Screenshot Plan Import

### [BUG] Single flight booking creates multiple incorrect plan entries
**File:** `mobile/ios/TripPlanner/BookingParserModule.swift`
**Status:** Fixed on `fix/screenshot-plan-import`

The Foundation Model prompt said "For multi-leg flights return one object per leg" — ambiguous enough that the model treated a nonstop LAX→STL flight as two legs (partly due to the seat-assignment section repeating the route). It produced 2 plan objects with hallucinated times (2:10 AM, 8:30 PM) and reversed direction on one (STL→LAX), and put "1:30 pm Jun 8 LAX STL" in the flight number field instead of "WN2400".

**Fix:** Tightened prompt — explicit rule that a nonstop = 1 element, seat-assignment repetition is not a leg, flight number field must be the code only, startDate must be copied verbatim.

---

### [BUG] Screenshot parser creates excessive plans (e.g. 10 for a hotel booking)
**File:** `mobile/ios/TripPlanner/BookingParserModule.swift`, `mobile/screens/TripDetailScreen.tsx`, `app/routes/plans.py`
**Status:** Fixed on `fix/screenshot-plan-import`

No upper bound on how many plans a single screenshot parse could produce. A hotel booking was observed generating 10 plan entries.

**Fix:** Client-side pre-flight check rejects arrays longer than 5 with a user-facing error. Backend `POST /from-parsed-bulk` returns 422 for more than 5 plans as a safety net.

---

### [BUG] Dates parsed from screenshots land in wrong year (e.g. Jun 8, 2024 for a 2026 trip)
**File:** `mobile/ios/TripPlanner/BookingParserModule.swift`, `mobile/screens/TripDetailScreen.tsx`
**Status:** Fixed on `fix/screenshot-plan-import`

Booking screenshots often omit the year ("Jun 8"). The Foundation Model hallucinated a past year (2024) from training data. `toISO()` passed the resulting ISO string straight through without checking if the year was stale, so the backend rejected the plan as outside the trip's date range.

**Fix:**
1. `toISO()` now checks if a parsed ISO date is more than 1 year in the past and nudges the year to current/next, matching the existing logic for year-0 dates.
2. The trip year is prepended to the OCR text before the model sees it: `[Trip year: 2026. When a date has no year, use 2026.]` — giving the model explicit context so it outputs the right year in the first place.
