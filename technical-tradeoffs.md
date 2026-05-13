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
