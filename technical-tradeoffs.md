# Trip Planner — Technical Tradeoffs

A running log of architectural decisions, options evaluated, and the rationale behind each choice.

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