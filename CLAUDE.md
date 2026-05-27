# Trip Planner

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Aurora) |
| Auth | AWS Auth |
| Booking Text Parsing | External library or in-house parsing logic |
| Deployment | Justfiles \| Hermit \| Terraform \| Docker Compose \| NPM |
| Type Sync | openapi-typescript (FastAPI schema → RN types) |

## Project Structure

```
/app        FastAPI application code
/models     SQLAlchemy / Pydantic models
/routes     API route handlers
/services   Business logic
/designs    Visual design exports (source of truth for UI)
```

## UI Design System

**Always follow the designs in `/designs/PlanMyTrip.html`.** Open it in a browser to see the screens and components.

All mobile UI work must use tokens from `mobile/theme.ts` — never hardcode colors, font sizes, radii, or spacing. The token names map directly to the design's CSS variables:

| Token file | What it covers |
|---|---|
| `colors.*` | Backgrounds, text, borders, accent, semantic (danger/success/warn), dark mode |
| `typography.*` | `fontSans`, `fontMono`, size scale (xs–4xl), weights |
| `radii.*` | `card` (18), `row` (14), `chip` (999/pill), sm/md/lg/xl |
| `spacing.*` | xs (4) through 2xl (24) |

When adding a new screen or component:
1. Check `/designs/PlanMyTrip.html` first — if the design exists, match it exactly.
2. Use `theme.ts` tokens for all style values.
3. If the design doesn't cover it, stay consistent with the existing token vocabulary (don't introduce new hardcoded values).

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.