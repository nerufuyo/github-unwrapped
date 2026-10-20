# GitHub Unwrapped 2026 — Design

## Goal
A web app where anyone enters a public GitHub username and gets a Spotify-Wrapped-style fullscreen story of their 2026 activity, with shareable link and images. Reference: githubunwrapped.com, github-wrapped.com, git-wrapped.com.

## Scope (v1)
- Public data only, no login. Username input only.
- Core stats, persona/badge, share image + OG.
- Out of scope: OAuth, private/org stats (v2), database, auto-advance, UI tests.
- Period: 2026-01-01 to now, labelled "2026 so far" until 2026-12-31.

## Stack
Next.js (App Router) on Vercel. GitHub GraphQL API with a server-side token (`GITHUB_TOKEN`). No database; responses cached with Next `revalidate` (~1 hour) to stay inside the 5000 req/hour limit.

## Routes
- `/` — username input, redirects to `/u/[user]`.
- `/u/[user]` — fullscreen story.
- `/u/[user]/opengraph-image` — dynamic OG image (1200×630) via `next/og`.
- `/api/wrapped/[user]` — returns `Stats` JSON.
- `/api/card/[user]/[n]` — PNG of card `n` via `next/og`, for download.

## Data layer
- `lib/github.ts` — one GraphQL query: `contributionsCollection(from: 2026-01-01)` plus repositories and languages. Only module that talks to the network.
- `lib/stats.ts` — pure function: raw response → `Stats` (totals, commit/PR/issue/review breakdown, top languages, top repo, busiest weekday and hour, longest streak, heatmap data).
- `lib/persona.ts` — rule-based persona from `Stats` (e.g. late-night dominant → Night Owl, weekend-heavy → Weekend Warrior, PR-heavy → PR Machine).

## UI
- `Story.tsx` — fullscreen container, `index` state; click left/right, swipe, or arrow keys change card; segmented progress bar on top.
- `cards/*.tsx` — one file per card, each takes `Stats`:
  1. Intro (avatar, "Your 2026 so far")
  2. Total contributions (count-up)
  3. Commit/PR/issue/review breakdown
  4. Top languages (bars)
  5. Top repo
  6. Busiest day and hour
  7. Longest streak + heatmap
  8. Persona/badge
  9. Summary + share buttons
- Animation: CSS plus `framer-motion` for card transitions and count-up only. No chart library; bars and heatmap are div/SVG.
- Theme: dark, one accent colour per card, large type, mobile-first 9:16, centred on desktop.

## Share
- Public link `/u/[user]`.
- Image rendering uses `next/og` as the single renderer (no `html2canvas`). Share cards are re-authored in `next/og` JSX (flexbox subset), so they are simplified versions of the on-screen cards by design.
- Buttons: copy link, download image, share to X (intent URL, no SDK).

## Errors and edge cases
- Unknown user → 404 page with username input.
- GitHub rate limit or upstream failure → friendly "try again" message.
- Zero contributions → total card shows an empty-state message; cards with no data are skipped.
- Loading → skeleton on the intro card.

## Testing
- Unit tests for `lib/stats.ts` and `lib/persona.ts` using JSON fixtures.
- Manual smoke check of `/u/<account>` and `curl` of the OG image URL. No UI tests in v1.
