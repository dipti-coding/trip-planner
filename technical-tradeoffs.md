# Trip Planner — Technical Tradeoffs

A running log of architectural decisions, options evaluated, and the rationale behind each choice.

---

## Authentication: JWT vs AWS Cognito vs Static API Key

**Decision: JWT (self-managed) for MVP — migrate to Cognito when deploying to AWS**

Three options were evaluated for protecting the FastAPI backend. The app currently has a single developer user; the solution must scale to multiple users without an auth layer rewrite.

### Option 1: Static API Key

A single secret token in an env var. Every request checks `Authorization: Bearer <token>`.

**Pros**
- ~30 minutes to implement, zero dependencies
- No database involvement, no token expiry to manage

**Cons**
- Token never expires — rotation is manual and all clients break simultaneously
- Doesn't model "users" at all — migrating to multi-user requires a full rewrite of the auth layer

### Option 2: JWT (self-managed, FastAPI + passlib + python-jose)

User submits email/password to `/auth/token`, receives a short-lived JWT. All protected routes verify the JWT via a `get_current_user` dependency.

**Phase 1 (now):** Credentials are a single hardcoded user stored in env vars (`AUTH_USER_EMAIL`, `AUTH_USER_PASSWORD_HASH`). No DB changes needed.

**Phase 2 (multi-user):** Add `hashed_password` to the `User` model, point `authenticate_user()` at the database. The JWT middleware, all protected routes, and the mobile client stay identical.

**Pros**
- Stateless — no session store needed
- Scales to multiple users with a single DB column addition and one function change in `app/auth.py`
- Not coupled to AWS — works in any environment
- Easy to later swap the token *issuer* to Cognito while keeping the same `Authorization: Bearer` contract

**Cons**
- Password hashing, token signing, and refresh logic are your responsibility
- Refresh tokens add complexity if needed (not implemented in Phase 1)
- Password reset / MFA are your problem

### Option 3: AWS Cognito

Managed identity service — handles signup, login, JWT issuance, refresh, MFA, social login. FastAPI verifies JWT signatures against Cognito's public JWKS endpoint.

**Pros**
- Aligns with AWS deployment target — no auth infrastructure to run or maintain
- Handles token refresh, password reset, MFA, social login out of the box
- Scales to any number of users with zero backend changes
- "One hardcoded user" is just one user in a Cognito User Pool — same code works for 1 or 10,000

**Cons**
- More AWS setup upfront (User Pool, App Client, JWKS verification middleware)
- Local dev requires mocking Cognito or always hitting the real pool, which adds friction during development
- Adds AWS lock-in to the auth layer — harder to run locally or switch cloud providers

### Comparison

| | Static API Key | JWT (self-managed) | AWS Cognito |
|---|---|---|---|
| Time to implement | 30 min | 2–3 hours | Half day |
| Scales to multi-user | No — rewrite needed | Yes — one DB column | Yes — zero changes |
| Local dev friction | None | None | Medium (mock or hit live pool) |
| AWS coupling | None | None | High |
| Managed security features | None | None | Full (MFA, reset, social) |
| **Best for** | Throwaway prototype | **MVP + near-term scale** | AWS deployment |

**Rationale:** JWT gives a clean working auth layer now, and the migration path to Cognito later is additive — Cognito becomes the token *issuer* but the `Authorization: Bearer` contract and all route dependencies remain unchanged. The single-to-multi-user migration (Phase 2) touches only `authenticate_user()` in `app/auth.py` and adds one column to the `users` table.

---

## Authentication: Supabase Auth vs Custom PostgreSQL Auth

**Decision: Supabase Auth (for MVP)**

The choice is effectively "managed auth service vs. rolling your own" using Postgres as the credential store.

### Supabase Auth

**Pros**
- Ships everything out of the box: JWT issuance, refresh tokens, session management, email confirmation, password reset flows, OAuth (Google, Apple)
- React Native SDK (`@supabase/supabase-js`) handles token storage and refresh automatically
- User management dashboard — view, disable, delete users without writing queries
- Integrates with Postgres Row Level Security (RLS) — DB policies like `auth.uid() = user_id` enforce data access at the DB layer
- Free up to 50,000 monthly active users

**Cons**
- Vendor dependency — auth is coupled to Supabase; migrating later requires exporting users and re-hashing passwords
- Less control over token claims, session behavior, and auth flows
- If you move off Supabase Postgres, auth moves too (they are bundled)

### Custom Auth (FastAPI + PostgreSQL)

**Pros**
- Full control — custom token claims, session length, refresh logic, any password policy
- No vendor dependency; auth lives in your own codebase
- Portable — works with any Postgres host (Railway, RDS, self-hosted)

**Cons**
- You build and maintain everything: password hashing (`bcrypt`/`argon2`), JWT signing, refresh token rotation, email confirmation links, password reset tokens
- Easy to introduce security bugs — token storage, timing attacks, improper invalidation
- No dashboard; user management requires writing admin queries or a custom UI
- React Native token persistence and refresh must be wired manually

### Comparison

| | Supabase Auth | Custom (FastAPI + Postgres) |
|---|---|---|
| Time to implement | Hours | Days |
| Security risk | Low (audited) | Higher (DIY) |
| Flexibility | Medium | Full |
| Vendor lock-in | Yes | No |
| RN SDK support | First-class | Manual |
| **Best for** | **MVP** | Scale / specific requirements |

**Rationale:** Secure auth is not a differentiating feature of this app. Supabase Auth is well-audited, the RLS integration with Postgres tables is a genuine advantage, and it eliminates days of implementation risk. The vendor lock-in is manageable — Supabase exports users as a standard Postgres table, and migration to a self-hosted GoTrue instance is possible if needed post-MVP.

---

## Authentication Phase 2: Sign in with Apple vs Email/Password

**Decision: Sign in with Apple + FastAPI JWT (access + refresh tokens)**

Phase 1 used a single hardcoded email/password user in env vars — sufficient for solo development. Phase 2 moves to real multi-user auth for TestFlight distribution.

### Options Evaluated

**Option 1: Email + Password**

- FastAPI verifies credentials against a `hashed_password` column on the `users` table
- Requires building password reset flows, managing password security, and email verification

**Pros:** Fast backend implementation; easy local dev and CI testing; works identically on iOS and Android

**Cons:** Must maintain password reset, email verification, and brute-force protection; more backend surface area to secure

**Option 2: Sign in with Apple**

- Mobile gets an Apple identity token; FastAPI verifies it against Apple's JWKS endpoint and issues its own JWT access + refresh token pair
- No passwords stored anywhere

**Pros:** No password storage or reset flows; native iOS UX (Face ID, one-tap); lower ongoing security burden; required by App Store guidelines for apps that offer any third-party login

**Cons:** More initial Apple Developer configuration; harder automated testing; users may hide their email

### Comparison

| | Email + Password | Sign in with Apple |
|---|---|---|
| Password storage | Yes (bcrypt) | No |
| Password reset | Must build | Not needed |
| iOS UX | Form-based | One-tap, Face ID |
| Automated testing | Easy | Requires mocking JWKS |
| App Store requirement | Optional | Required if offering social login |
| **Best for** | Android / cross-platform | **iOS MVP** |

### Decision

Sign in with Apple for all sign-ins. `POST /auth/token` (email+password) retained but gated behind `AUTH_DEV_MODE=true` for local dev and CI — it will not be active in production.

### User identifier design

Apple's `sub` claim (a stable opaque user ID, e.g. `000234.abc...`) is stored as `apple_id` on the `users` table and used as the primary lookup key. This handles both sign-in paths:

- **Real email path:** Apple sends `sub` + real email on first sign-in → both stored
- **Hide My Email path:** Apple sends `sub` + relay address on first sign-in → both stored
- **All subsequent sign-ins:** Apple sends `sub` only → user looked up by `apple_id`; email not required

`email` stays on the `users` table but becomes nullable. The JWT `sub` claim holds the wandur user UUID (not the Apple ID or email).

### Token strategy

Access tokens valid for 60 min + long-lived refresh tokens (30 days) stored in iOS Keychain via `react-native-keychain`. The mobile client silently refreshes on 401. Refresh tokens are stored in a `refresh_tokens` table and invalidated on sign-out.

---

## Booking Confirmation Parsing: Claude API vs Alternatives

**Decision: Claude API — Sonnet (for MVP), revisit at scale**

Booking confirmations have no standard format. A United Airlines confirmation looks completely different from Delta, and Marriott looks nothing like Airbnb. Any non-LLM approach requires maintaining provider-specific patterns.

### Options Evaluated

| Option | Cost | Reliability | Maintenance | Decision |
|---|---|---|---|---|
| Claude API (Sonnet) | ~$0.007/call | High | None | **Selected for MVP** |
| Gemini API | Free tier available | High | None | Valid swap if cost is a concern |
| TripIt API | Paid (~$299/mo flat) | Very high | None | Post-MVP — email forwarding only, not paste-box |
| Regex / rule-based | Free | Low | High | Avoided — breaks when providers change templates |
| spaCy / NLTK | Free | Medium | Medium | Supplement only — no booking context awareness |
| Ollama (local LLM) | Server cost | Medium | Medium | Post-MVP at scale — adds infrastructure complexity |

### Cost Analysis (Claude Sonnet)

| Token type | Estimated tokens | Cost |
|---|---|---|
| Input (system prompt + pasted text) | ~800 tokens | ~$0.0024 |
| Output (structured plan JSON) | ~300 tokens | ~$0.0045 |
| **Total per call** | | **~$0.007** |

**Monthly cost at scale:**

| Active users | Avg parses/user/month | Total calls | Est. monthly cost |
|---|---|---|---|
| 100 | 10 | 1,000 | ~$7 |
| 1,000 | 10 | 10,000 | ~$70 |
| 10,000 | 10 | 100,000 | ~$700 |

**Cost controls:**
- Rate limit: 10 parses per user per day
- Prompt caching: cache the system prompt — reused on every call, reduces input token cost ~90% on the cached portion
- Hard monthly spend cap in the Anthropic console

**Break-even vs TripIt API:** TripIt becomes cheaper beyond ~40,000 parse calls/month (~4,000 active users parsing 10x/month). Claude API is the right choice through early growth.


## Plan `details` Field: JSON vs JSONB

**Decision: JSONB**

The `plans` table stores type-specific fields (flight seat, hotel confirmation, restaurant party size, etc.) in a single `details` column rather than 13 separate tables or dozens of nullable columns.

### Options Evaluated

| | JSON | JSONB |
|---|---|---|
| Storage | Stored as plain text | Stored as decomposed binary |
| Read speed | Slower — must re-parse on every read | Faster — pre-parsed, binary comparison |
| Write speed | Slightly faster | Slightly slower (decomposition on insert) |
| Indexing | Not indexable | Supports GIN indexes for key/value queries |
| Key ordering | Preserves insertion order | Does not preserve key order |
| Duplicate keys | Preserves all duplicates | Keeps last value only |
| **Best for** | Audit logs, write-heavy append-only data | **Application data queried by content** |

### Rationale

JSONB is the right choice here for three reasons:

1. **Query performance** — future features (e.g. find all flights with `departure_airport = "SFO"`) require filtering inside the JSON blob. JSONB supports GIN indexes for this; plain JSON does not.
2. **Read-heavy access pattern** — plans are read every time a trip is opened. Binary storage means no re-parsing overhead on each read.
3. **No ordering requirement** — plan details have no meaningful key order, so the one downside of JSONB (no key order preservation) does not apply.

**Alternative considered:** Separate table per plan type (e.g. `flight_plans`, `hotel_plans`). Rejected because it requires 13 tables, complex polymorphic joins, and schema migrations every time a new plan type is added. JSONB keeps the schema stable while the Pydantic layer (`app/schemas/plan_details.py`) enforces the shape per type.

---

## Location Lookup API: Trip Creation vs Plan Creation

**Decision: Photon (trip destination) + Geoapify (plan POI) — revisit at scale**

The app has two distinct location lookup needs with different data requirements, so they are treated as separate services behind a thin abstraction layer (`locationService.ts` / `placesService.ts`) that normalizes responses to internal types. Swapping a provider means changing one file.

### Use Case 1: Trip Creation (city/destination autocomplete)

| API | Free Limit | API Key | Attribution | Notes |
|---|---|---|---|---|
| **Photon (Komoot)** | Unlimited\* | None | OSM credit required | Best autocomplete UX; self-hostable |
| Mapbox Geocoding | 100k req/mo | Yes, no CC | None required | Clean API, clear upgrade path |
| LocationIQ | 5k req/day | Yes, no CC | Link required | Most generous hard daily limit |
| Nominatim (OSM) | 1 req/sec | None | OSM credit required | No autocomplete; better self-hosted |

**Selected: Photon.** No key required, great search-as-you-type, no CC. At 1,000 users with typical usage stays well under "reasonable use." Mapbox is the natural upgrade — same API shape, 100k/mo hard limit, no attribution.

### Use Case 2: Plan Creation (POI search — restaurants, hotels, attractions)

| API | Free Limit | API Key | Attribution | Notes |
|---|---|---|---|---|
| **Geoapify Places** | 3k credits/day (~90k/mo) | Yes, no CC | Check docs | Single provider covers geocoding + POI |
| Foursquare Places | 10k calls/mo | Yes, CC required | Required | Best POI data quality; CC is a barrier |
| Overpass (OSM) | Unlimited\* | None | OSM credit required | Complex query language; raw data |

**Selected: Geoapify.** 3k credits/day is plenty for 1,000 users, no CC required, covers POI categories well. Foursquare is the upgrade path if richer POI data (photos, ratings, hours) is needed.

### Scale thresholds

| Users | Trip lookup | Plan POI |
|---|---|---|
| ≤ 1,000 | Photon (free, no key) | Geoapify (3k/day free) |
| ~5,000 | Mapbox (100k/mo free) | Geoapify paid or Foursquare |
| 10,000+ | Mapbox paid | Foursquare Places |

### Abstraction approach

Two service files with normalized return types decouple providers from UI:

```
services/
  locationService.ts   ← searchDestinations(query) → {id, name, lat, lng}[]
  placesService.ts     ← searchPlaces(query, lat, lng, category) → Place[]
```

Swapping Photon → Mapbox is a single-file change. Components never import provider SDKs directly.

---

## Booking Confirmation Text Parsing

The core problem
  
  Booking confirmations have no standard format. A United Airlines confirmation looks completely different from a Delta one, and a Marriott confirmation looks nothing like an Airbnb one. Any non-LLM approach requires you to maintain provider-specific patterns.

  ---
  Alternatives
  
  Rule-based / Regex

  - Write custom patterns per provider (e.g. Confirmation #: ([A-Z0-9]+))
  - Free, runs locally, no API cost
  - Breaks any time a provider changes their email template
  - Requires maintaining patterns for every airline, hotel chain, car rental company
  - Verdict: Only viable if you limit to 3-5 known providers

  spaCy / NLTK (Python NLP)

  - Named entity recognition — extracts dates, locations, org names
  - Good at pulling out "New York", "June 15", "Marriott" from text
  - Does not understand booking context — won't distinguish check-in date from check-out date, or know that "F3C" is a seat number
  - Verdict: Useful as a supplement, not a replacement

  TripIt API

  - Purpose-built travel confirmation parser — handles hundreds of providers
  - Designed for exactly this use case
  - Requires forwarding an email to a TripIt address, not paste-box input
  - Paid API, more complex integration
  - Verdict: Strong option if you shift to email forwarding (Post-MVP feature anyway)

  Other LLM APIs (OpenAI, Gemini)

  - Same capability as Claude, different pricing/terms
  - Gemini has a free tier that may cover MVP usage
  - OpenAI GPT-4o is slightly more expensive than Claude Sonnet
  - Verdict: Valid swap, no architectural difference

  Ollama (local LLM)

  - Run an open-source model (Llama 3, Mistral) on your own server
  - No per-call cost, data stays local
  - Requires a GPU server or a beefy VPS — adds infrastructure complexity
  - Smaller models are less reliable at structured extraction
  - Verdict: Worth it at scale, overkill for MVP

  ---
  ### Options Considered

The paste-box feature (Week 2) requires extracting structured data from unstructured booking text. Booking confirmations have no standard format — a United Airlines confirmation looks completely different from a Delta one, and Marriott looks nothing like Airbnb. Options evaluated:

| Option | Cost | Reliability | Maintenance | Decision |
|---|---|---|---|---|
| Claude API (Sonnet) | ~$0.003/call | High | None | To be considered based on cost |
| Gemini API | Free tier available | High | None | Valid swap if cost is a concern |
| TripIt API | Paid | Very high | None | Post-MVP — email forwarding only, not paste-box |
| Regex / rule-based | Free | Low | High | Avoided — breaks when providers change templates |
| spaCy / NLTK | Free | Medium | Medium | Useful as supplement only — no booking context awareness |
| Ollama (local LLM) | Server cost | Medium | Medium | Post-MVP at scale — adds infrastructure complexity |