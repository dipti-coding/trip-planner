# Product Requirements Document — Trip Planner MVP

**Version:** 1.0  
**Date:** 2026-05-13  
**Status:** Draft

---

## 1. Overview

Trip Planner is a mobile app that helps travelers organize itineraries around their destination, local weather, and personal activity preferences. Users can create trips, parse booking confirmations into structured plans, and share read-only itineraries with others.

---

## 2. Goals

- Give travelers a single place to store flights, hotels, and activities for a trip
- Reduce manual data entry by parsing booking confirmation text into structured plans
- Surface relevant weather context alongside plans
- Trip PDF export

---

## 3. Non-Goals (Post-MVP)

- Real-time collaborative editing
- Google Maps nearby-places integration
- Enable frictionless sharing of itineraries with travel companions
- AI-suggested plans for empty time slots
- Public transit routing
- Email-to-plan parsing

---

## 4. User Stories

### 4.1 Profile

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| P1 | As a user, I can create a profile tied to my email address | Profile stores: email, home city, activity preferences |
| P2 | As a user, I can select activity preferences from a predefined list | Options include: Hiking, Yoga, Biking, Wine Tasting (extensible list) |
| P3 | As a user, I can edit my profile at any time | Changes persist immediately |

### 4.2 Trip Creation

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| T1 | As a user, I can create a new empty trip | Required fields: trip name, destination city, start date, end date |
| T2 | As a user, I receive a unique trip ID after creating a trip | Trip ID is displayed prominently on the individual Trip page |
| T3 | As a user, I can view all my trips in a list | List shows trip name, destination, and date range |
| T4 | As a user, I can delete a trip | Deletion requires confirmation; removes all associated plans |

### 4.3 Plan Parsing

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| PL1 | As a user, I can paste booking confirmation text into a text box | Text box is accessible from within an existing trip |
| PL2 | The app parses the pasted text and extracts plan details | Extracts: plan type, name, date/time, location, confirmation number (where present) |
| PL3 | Parsed plan is added to the trip after user confirms | User reviews and confirms before saving; can edit extracted fields |
| PL4 | If parsing fails or is ambiguous, user is prompted to fill in details manually | Graceful fallback with partially pre-filled fields |

### 4.4 Plan Types

All plan types share: name, date, start time, end time (optional), location, notes.  
Type-specific fields listed below.

| Plan Type | Type-Specific Fields |
|-----------|----------------------|
| Flight | Airline, flight number, departure airport, arrival airport, confirmation # |
| Hotel | Property name, check-in date, check-out date, confirmation # |
| Activity | Activity type (from user preferences), venue |
| Restaurant | Cuisine type, reservation # |
| Meeting | Attendees |
| Tour | Operator name, tour name |
| Car Reservation | Rental company, pickup location, drop-off location, confirmation # |
| Cruise | Cruise line, ship name, port of departure, port of arrival |
| Ferry Ride | Operator, departure port, arrival port |
| Map Destination | Address or coordinates, notes |
| Railway Ride | Operator, departure station, arrival station, booking reference |
| Bus Ride | Operator, departure stop, arrival stop |
| Local Event | Event type (Picnic / Comedy Show / Concert / Other), venue |

### 4.5 Itinerary View

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| I1 | As a user, I can view all plans for a trip in chronological order | Plans grouped by day; sorted by start time within each day |
| I2 | As a user, I can edit any plan | All fields editable inline or via edit screen |
| I3 | As a user, I can delete a plan | Deletion requires confirmation |
| I4 | As a user, I see a live weather icon next to each plan | Icon reflects current weather conditions at the plan's location on the plan's date/time |

### 4.6 Trip PDF Export

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| S1 | As a user, I can click on the Export Button to down a PDF file with the trip and its associated plans |
| S2 | Read-only view shows all plans with all fields | Weather icons included in read-only view |

---
## 5. Functional Requirements

### 5.1 Booking Text Parser

- Accepts free-form text (copy-pasted from email confirmations)
- Must detect plan type from content signals (e.g., flight numbers, "Check-in", "Reservation")
- Extracts: dates, times, locations, confirmation numbers, carrier/operator names
- Returns a pre-filled plan for user review before saving
- Operates on-device or via backend API — must not store raw pasted text beyond the session

### 5.2 Weather Integration

- Source: a weather API (e.g., OpenWeatherMeter or similar) with forecast coverage
- Display: weather icon (sunny, cloudy, rainy, snowy, etc.) per plan
- Refresh: icons update when the itinerary view is loaded; cached for ≤ 1 hour
- Fallback: no icon displayed if weather data unavailable

### 5.3 Authentication

- Email-based account creation and login (magic link or email + password)
- Sessions persist on device
- Password reset via email

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Platform | iOS (first release); Android out of scope for MVP |
| Performance | Trip and plan screens load in < 2 s on LTE |
| Security | All API traffic over HTTPS; shared trip links expire after 30 days by default |
| Privacy | Pasted booking text not persisted server-side after parsing |

---

## 7. Out of Scope

See §3 Non-Goals. Additionally out of scope for MVP:

- Push notifications
- In-app chat or comments
- Multi-currency budget tracking
- Photo attachments to plans

---

## 8. Open Questions

| # | Question | Owner |
|---|----------|-------|
| 1 | Which weather API provider? Cost/coverage trade-offs TBD | Engineering |
| 2 | Magic link vs. email+password auth — which implementation path? | Product / Engineering |
| 3 | Should the share link require the recipient to create an account? | Product |
| 4 | 30-day share link expiry — should the owner be able to set a custom expiry? | Product |
| 5 | How should conflicting plans (same time slot) be surfaced to the user? | Design |

---

## 10. Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Trip creation to first plan added | < 3 minutes (median) |
| Booking parser accuracy | ≥ 80% of fields correctly extracted without user correction |
