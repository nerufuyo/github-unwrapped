# GitHub Unwrapped 2026 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app: enter a public GitHub username, get a fullscreen Spotify-Wrapped-style story of 2026 activity with share link and images.

**Architecture:** Next.js App Router. Server code fetches GitHub GraphQL (plus one REST call for commit hours) with a server token, pure functions turn raw data into `Stats` and a persona, a client `Story` component renders cards, and `next/og` renders every share image. No database; Next fetch cache (`revalidate: 3600`) protects the rate limit.

**Tech Stack:** Next.js 15, React 19, TypeScript, framer-motion, Vitest.

## Global Constraints

- Public data only, no login, no OAuth, no database.
- Period: `2026-01-01` to now. Label: "Your 2026 so far".
- Next.js App Router on Vercel; GitHub token in env `GITHUB_TOKEN`; cache `revalidate: 3600`.
- No chart library, no `html2canvas`; bars/heatmap are div/SVG; images only via `next/og`.
- framer-motion only for card transitions and count-up.
- Dark theme, mobile-first 9:16, centred on desktop.
- Tests: unit tests for `lib/stats.ts`, `lib/persona.ts`, `lib/shareCards.ts` only. No UI tests.

**Deviations from spec (data availability):** GraphQL has no commit timestamps, so "busiest hour" is computed from a REST commit-search sample (up to 300 most recent commits, UTC) and is skipped if that call fails. Top languages = repo primary language weighted by commit count. Total = sum of calendar days.

## File Structure

```
package.json, tsconfig.json, vitest.config.ts, .gitignore, .env.example
app/layout.tsx, app/globals.css, app/page.tsx
app/u/[user]/page.tsx, app/u/[user]/opengraph-image.tsx
app/api/wrapped/[user]/route.ts, app/api/card/[user]/[n]/route.ts
lib/types.ts       shared types
lib/stats.ts       pure: RawData -> Stats
lib/persona.ts     pure: Stats -> Persona
lib/github.ts      only network code + error classes
lib/wrapped.ts     getWrapped(login): Wrapped
lib/shareCards.ts  Wrapped -> ShareCard[] (data for images)
lib/shareImage.tsx ShareCard -> next/og JSX
components/Story.tsx, components/CountUp.tsx, components/Heatmap.tsx, components/ShareButtons.tsx
components/cards/Card.tsx + Intro, Total, Breakdown, Languages, Repo, Busiest, Streak, PersonaCard, Summary, index.tsx
tests/fixture.ts, tests/stats.test.ts, tests/persona.test.ts, tests/shareCards.test.ts
```

---

### Task 1: Scaffold project and shared types

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `lib/types.ts`

**Interfaces:**
- Produces (`lib/types.ts`): `RawDay`, `RawRepo`, `RawData`, `Persona`, `Stats`, `Wrapped` exactly as below. All later tasks import from `@/lib/types`.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "github-unwrapped",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "framer-motion": "^12.0.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write config files**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: { include: ['tests/**/*.test.ts'] },
});
```

`.gitignore`:
```
node_modules
.next
.env
.env.local
next-env.d.ts
*.tsbuildinfo
```

`.env.example`:
```
# GitHub personal access token, no scopes needed (public data only)
GITHUB_TOKEN=
```

- [ ] **Step 3: Write `lib/types.ts`**

```ts
export interface RawDay {
  date: string; // YYYY-MM-DD, consecutive, ascending
  count: number;
}

export interface RawRepo {
  name: string; // owner/name
  commits: number;
  language: { name: string; color: string | null } | null;
}

export interface RawData {
  user: { login: string; name: string | null; avatarUrl: string };
  totals: { commits: number; prs: number; issues: number; reviews: number };
  days: RawDay[];
  repos: RawRepo[];
  commitHours: number[] | null; // 24 UTC buckets from a commit sample, null if unavailable
}

export interface Persona {
  id: string;
  title: string;
  blurb: string;
}

export interface Stats {
  login: string;
  name: string | null;
  avatarUrl: string;
  total: number;
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  activeDays: number;
  longestStreak: number;
  busiestWeekday: string | null;
  busiestHour: number | null; // 0-23 UTC
  topLanguages: { name: string; color: string | null; pct: number }[]; // max 5
  topRepo: { name: string; commits: number } | null;
  days: RawDay[];
}

export type Wrapped = Stats & { persona: Persona };
```

- [ ] **Step 4: Write `app/layout.tsx` and `app/globals.css`**

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitHub Unwrapped 2026',
  description: 'Your 2026 on GitHub, unwrapped.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`app/globals.css`:
```css
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: #010409; color: #fff; font-family: system-ui, sans-serif; }
a { color: inherit; }

.home { min-height: 100%; display: grid; place-content: center; gap: 16px; text-align: center; padding: 24px; }
.home h1 { font-size: clamp(2rem, 8vw, 3.5rem); margin: 0; }
.home form { display: flex; gap: 8px; justify-content: center; }
.home input { padding: 12px 16px; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #fff; font-size: 1rem; }
.home button, .share button, .share a { padding: 12px 16px; border-radius: 8px; border: 0; background: #238636; color: #fff; font-size: 1rem; cursor: pointer; text-decoration: none; }

.story { position: relative; height: 100dvh; max-width: 480px; margin: 0 auto; background: #0d1117; overflow: hidden; touch-action: pan-y; user-select: none; }
.progress { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; gap: 4px; z-index: 2; }
.progress i { flex: 1; height: 3px; border-radius: 2px; background: #30363d; }
.progress i.done { background: #fff; }

.card { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; gap: 12px; padding: 48px 32px; background: radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--accent) 25%, #0d1117), #0d1117 70%); }
.card h2 { margin: 0; font-size: 1.1rem; color: var(--accent); text-transform: uppercase; letter-spacing: 0.08em; }
.card .big { margin: 0; font-size: clamp(2.5rem, 14vw, 4.5rem); font-weight: 800; color: var(--accent); line-height: 1.05; word-break: break-word; }
.card .sub { margin: 0; font-size: 1.2rem; color: #c9d1d9; }
.card .hint { margin-top: 24px; color: #8b949e; font-size: 0.9rem; }
.avatar { width: 112px; height: 112px; border-radius: 50%; border: 3px solid var(--accent); }
.row { display: flex; justify-content: space-between; font-size: 1.3rem; padding: 6px 0; border-bottom: 1px solid #21262d; }
.row b { color: var(--accent); }
.lang { font-size: 1.1rem; }
.bar { height: 10px; border-radius: 5px; margin: 4px 0 10px; }
.heatmap { width: 100%; height: auto; margin-top: 8px; }
.share { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.share .dl { display: flex; gap: 4px; align-items: center; font-size: 0.9rem; color: #8b949e; }
.share .dl a { padding: 6px 10px; background: #21262d; }
```

- [ ] **Step 5: Install and type-check**

Run: `npm install && npx tsc --noEmit`
Expected: install succeeds; tsc exits 0 (no output).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore .env.example app lib
git commit -m "chore: scaffold Next.js app and shared types"
```

---

### Task 2: Stats computation (TDD)

**Files:**
- Create: `tests/fixture.ts`, `tests/stats.test.ts`, `lib/stats.ts`

**Interfaces:**
- Consumes: `RawData`, `RawDay`, `Stats` from `@/lib/types`.
- Produces: `computeStats(raw: RawData): Stats`, `longestStreak(days: RawDay[]): number`; `tests/fixture.ts` exports `raw: RawData` (reused by Task 3 and 6).

- [ ] **Step 1: Write `tests/fixture.ts`**

2026-01-01 is a Thursday. Days: Thu 0, Fri 1, Sat 2, Sun 3, Mon 0, Tue 4 (total 10, streak 3, busiest Tuesday, weekend share 0.5).

```ts
import type { RawData } from '@/lib/types';

const hours = Array<number>(24).fill(0);
hours[23] = 5;

export const raw: RawData = {
  user: { login: 'octo', name: 'Octo Cat', avatarUrl: 'https://example.com/a.png' },
  totals: { commits: 10, prs: 2, issues: 1, reviews: 1 },
  days: [
    { date: '2026-01-01', count: 0 },
    { date: '2026-01-02', count: 1 },
    { date: '2026-01-03', count: 2 },
    { date: '2026-01-04', count: 3 },
    { date: '2026-01-05', count: 0 },
    { date: '2026-01-06', count: 4 },
  ],
  repos: [
    { name: 'octo/a', commits: 5, language: { name: 'TypeScript', color: '#3178c6' } },
    { name: 'octo/b', commits: 3, language: { name: 'TypeScript', color: '#3178c6' } },
    { name: 'octo/c', commits: 2, language: { name: 'Go', color: '#00add8' } },
  ],
  commitHours: hours,
};
```

- [ ] **Step 2: Write the failing test `tests/stats.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { computeStats, longestStreak } from '@/lib/stats';
import { raw } from './fixture';

describe('computeStats', () => {
  it('computes totals, streak, busiest day/hour', () => {
    const s = computeStats(raw);
    expect(s.total).toBe(10);
    expect(s.activeDays).toBe(4);
    expect(s.longestStreak).toBe(3);
    expect(s.busiestWeekday).toBe('Tuesday');
    expect(s.busiestHour).toBe(23);
    expect(s.commits).toBe(10);
    expect(s.login).toBe('octo');
  });

  it('aggregates languages by commits and picks top repo', () => {
    const s = computeStats(raw);
    expect(s.topLanguages).toEqual([
      { name: 'TypeScript', color: '#3178c6', pct: 80 },
      { name: 'Go', color: '#00add8', pct: 20 },
    ]);
    expect(s.topRepo).toEqual({ name: 'octo/a', commits: 5 });
  });

  it('handles empty activity', () => {
    const s = computeStats({
      ...raw,
      totals: { commits: 0, prs: 0, issues: 0, reviews: 0 },
      days: raw.days.map((d) => ({ ...d, count: 0 })),
      repos: [],
      commitHours: null,
    });
    expect(s.total).toBe(0);
    expect(s.longestStreak).toBe(0);
    expect(s.busiestWeekday).toBeNull();
    expect(s.busiestHour).toBeNull();
    expect(s.topLanguages).toEqual([]);
    expect(s.topRepo).toBeNull();
  });
});

describe('longestStreak', () => {
  it('resets on a zero day', () => {
    const d = [1, 1, 0, 1, 1, 1].map((count, i) => ({ date: `2026-01-0${i + 1}`, count }));
    expect(longestStreak(d)).toBe(3);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/stats.test.ts`
Expected: FAIL (cannot resolve `@/lib/stats`).

- [ ] **Step 4: Write `lib/stats.ts`**

```ts
import type { RawData, RawDay, Stats } from './types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function argMax(values: number[]): number | null {
  let best = -1;
  let idx = -1;
  values.forEach((v, i) => {
    if (v > best) {
      best = v;
      idx = i;
    }
  });
  return best > 0 ? idx : null;
}

export function longestStreak(days: RawDay[]): number {
  let best = 0;
  let cur = 0;
  for (const d of days) {
    cur = d.count > 0 ? cur + 1 : 0;
    best = Math.max(best, cur);
  }
  return best;
}

export function computeStats(raw: RawData): Stats {
  const byWeekday = Array<number>(7).fill(0);
  for (const d of raw.days) byWeekday[new Date(`${d.date}T00:00:00Z`).getUTCDay()] += d.count;
  const wd = argMax(byWeekday);

  const langs = new Map<string, { color: string | null; commits: number }>();
  let langTotal = 0;
  for (const r of raw.repos) {
    if (!r.language) continue;
    const cur = langs.get(r.language.name) ?? { color: r.language.color, commits: 0 };
    cur.commits += r.commits;
    langs.set(r.language.name, cur);
    langTotal += r.commits;
  }
  const topLanguages = [...langs.entries()]
    .sort((a, b) => b[1].commits - a[1].commits)
    .slice(0, 5)
    .map(([name, v]) => ({ name, color: v.color, pct: Math.round((v.commits / langTotal) * 100) }));

  const top = [...raw.repos].sort((a, b) => b.commits - a.commits)[0];

  return {
    login: raw.user.login,
    name: raw.user.name,
    avatarUrl: raw.user.avatarUrl,
    total: raw.days.reduce((n, d) => n + d.count, 0),
    commits: raw.totals.commits,
    prs: raw.totals.prs,
    issues: raw.totals.issues,
    reviews: raw.totals.reviews,
    activeDays: raw.days.filter((d) => d.count > 0).length,
    longestStreak: longestStreak(raw.days),
    busiestWeekday: wd === null ? null : WEEKDAYS[wd],
    busiestHour: raw.commitHours ? argMax(raw.commitHours) : null,
    topLanguages,
    topRepo: top && top.commits > 0 ? { name: top.name, commits: top.commits } : null,
    days: raw.days,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/stats.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add lib/stats.ts tests/fixture.ts tests/stats.test.ts
git commit -m "feat: compute stats from raw GitHub data"
```

---

### Task 3: Persona rules (TDD)

**Files:**
- Create: `tests/persona.test.ts`, `lib/persona.ts`

**Interfaces:**
- Consumes: `computeStats`, `raw` fixture, `Stats`, `Persona`.
- Produces: `pickPersona(s: Stats): Persona`. Persona ids: `ghost`, `night-owl`, `weekend-warrior`, `pr-machine`, `streak-keeper`, `steady-builder`.

- [ ] **Step 1: Write the failing test `tests/persona.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { computeStats } from '@/lib/stats';
import { pickPersona } from '@/lib/persona';
import type { RawData } from '@/lib/types';
import { raw } from './fixture';

const id = (over: Partial<RawData>) => pickPersona(computeStats({ ...raw, ...over })).id;

const tuesdays = [{ date: '2026-01-06', count: 3 }]; // a Tuesday: no weekend share
const quiet = { commitHours: null, days: tuesdays };

describe('pickPersona', () => {
  it('ghost when no activity', () => {
    expect(id({ days: raw.days.map((d) => ({ ...d, count: 0 })), commitHours: null })).toBe('ghost');
  });
  it('night owl when busiest hour is late', () => {
    expect(id({})).toBe('night-owl'); // fixture hour 23
  });
  it('weekend warrior when >=40% on weekends', () => {
    expect(id({ commitHours: null })).toBe('weekend-warrior'); // fixture weekend share 0.5
  });
  it('pr machine when PRs+reviews outweigh commits', () => {
    expect(id({ ...quiet, totals: { commits: 10, prs: 8, issues: 0, reviews: 0 } })).toBe('pr-machine');
  });
  it('streak keeper at 30+ day streak', () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 5 + i)).toISOString().slice(0, 10),
      count: 1,
    }));
    expect(id({ commitHours: null, days, totals: { commits: 30, prs: 0, issues: 0, reviews: 0 } })).toBe('streak-keeper');
  });
  it('steady builder otherwise', () => {
    expect(id({ ...quiet, totals: { commits: 3, prs: 0, issues: 0, reviews: 0 } })).toBe('steady-builder');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/persona.test.ts`
Expected: FAIL (cannot resolve `@/lib/persona`).

- [ ] **Step 3: Write `lib/persona.ts`**

```ts
import type { Persona, Stats } from './types';

const P = {
  ghost: { id: 'ghost', title: 'The Quiet One', blurb: 'No public commits yet. The year is young.' },
  owl: { id: 'night-owl', title: 'Night Owl', blurb: 'Your best commits land after dark.' },
  weekend: { id: 'weekend-warrior', title: 'Weekend Warrior', blurb: 'Saturdays and Sundays are for shipping.' },
  pr: { id: 'pr-machine', title: 'PR Machine', blurb: 'Pull requests and reviews are your love language.' },
  streak: { id: 'streak-keeper', title: 'Streak Keeper', blurb: '30+ days in a row. Consistency wins.' },
  steady: { id: 'steady-builder', title: 'Steady Builder', blurb: 'Quietly building, one commit at a time.' },
} satisfies Record<string, Persona>;

export function pickPersona(s: Stats): Persona {
  if (s.total === 0) return P.ghost;
  if (s.busiestHour !== null && (s.busiestHour >= 22 || s.busiestHour <= 4)) return P.owl;
  const weekend = s.days.reduce((n, d) => {
    const wd = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    return wd === 0 || wd === 6 ? n + d.count : n;
  }, 0);
  if (weekend / s.total >= 0.4) return P.weekend;
  if (s.prs + s.reviews > s.commits * 0.5) return P.pr;
  if (s.longestStreak >= 30) return P.streak;
  return P.steady;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`
Expected: PASS (all tests in stats + persona).

- [ ] **Step 5: Commit**

```bash
git add lib/persona.ts tests/persona.test.ts
git commit -m "feat: add rule-based persona"
```

---

### Task 4: GitHub fetching, `getWrapped`, API route

**Files:**
- Create: `lib/github.ts`, `lib/wrapped.ts`, `app/api/wrapped/[user]/route.ts`

**Interfaces:**
- Consumes: `RawData`, `computeStats`, `pickPersona`, `Wrapped`.
- Produces:
  - `lib/github.ts`: `class NotFoundError extends Error`, `class RateLimitError extends Error`, `fetchRaw(login: string): Promise<RawData>`, `httpStatus(e: unknown): number`.
  - `lib/wrapped.ts`: `getWrapped(login: string): Promise<Wrapped>` (throws `NotFoundError` on invalid/unknown login).

- [ ] **Step 1: Write `lib/github.ts`**

```ts
import type { RawData } from './types';

export class NotFoundError extends Error {}
export class RateLimitError extends Error {}

export const YEAR_START = '2026-01-01T00:00:00Z';
const REVALIDATE = 3600;

const QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login name avatarUrl
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner primaryLanguage { name color } }
        contributions(first: 1) { totalCount }
      }
    }
  }
}`;

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
}

function checkRate(res: Response) {
  if (res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')) {
    throw new RateLimitError('GitHub rate limit reached');
  }
}

// Commit timestamps are not in GraphQL; sample up to 300 recent commits via REST search (UTC hours).
async function fetchCommitHours(login: string): Promise<number[] | null> {
  try {
    const hours = Array<number>(24).fill(0);
    for (let page = 1; page <= 3; page++) {
      const q = encodeURIComponent(`author:${login} author-date:>=2026-01-01`);
      const res = await fetch(
        `https://api.github.com/search/commits?q=${q}&sort=author-date&order=desc&per_page=100&page=${page}`,
        { headers: headers(), next: { revalidate: REVALIDATE } },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { items: { commit: { author: { date: string } } }[] };
      for (const it of json.items) hours[new Date(it.commit.author.date).getUTCHours()]++;
      if (json.items.length < 100) break;
    }
    return hours;
  } catch {
    return null;
  }
}

export async function fetchRaw(login: string): Promise<RawData> {
  const hourStep = 3600_000;
  const to = new Date(Math.floor(Date.now() / hourStep) * hourStep).toISOString(); // stable per hour => cacheable
  const [res, commitHours] = await Promise.all([
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { login, from: YEAR_START, to } }),
      next: { revalidate: REVALIDATE },
    }),
    fetchCommitHours(login),
  ]);
  checkRate(res);
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);

  const json = await res.json();
  if (json.errors?.some((e: { type?: string }) => e.type === 'RATE_LIMITED')) throw new RateLimitError('GitHub rate limit reached');
  const u = json.data?.user;
  if (!u) throw new NotFoundError(`No GitHub user "${login}"`);

  const c = u.contributionsCollection;
  const days = c.contributionCalendar.weeks
    .flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) => w.contributionDays)
    .map((d: { date: string; contributionCount: number }) => ({ date: d.date, count: d.contributionCount }))
    .filter((d: { date: string }) => d.date >= YEAR_START.slice(0, 10));

  return {
    user: { login: u.login, name: u.name, avatarUrl: u.avatarUrl },
    totals: {
      commits: c.totalCommitContributions,
      prs: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
    },
    days,
    repos: c.commitContributionsByRepository.map(
      (r: { repository: { nameWithOwner: string; primaryLanguage: { name: string; color: string | null } | null }; contributions: { totalCount: number } }) => ({
        name: r.repository.nameWithOwner,
        commits: r.contributions.totalCount,
        language: r.repository.primaryLanguage,
      }),
    ),
    commitHours,
  };
}

export function httpStatus(e: unknown): number {
  if (e instanceof NotFoundError) return 404;
  if (e instanceof RateLimitError) return 429;
  return 500;
}
```

- [ ] **Step 2: Write `lib/wrapped.ts`**

```ts
import { fetchRaw, NotFoundError } from './github';
import { pickPersona } from './persona';
import { computeStats } from './stats';
import type { Wrapped } from './types';

// GitHub login rules: alphanumeric or single hyphens, 1-39 chars. Guards the REST search query.
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export async function getWrapped(login: string): Promise<Wrapped> {
  if (!LOGIN.test(login)) throw new NotFoundError(`Invalid username "${login}"`);
  const stats = computeStats(await fetchRaw(login));
  return { ...stats, persona: pickPersona(stats) };
}
```

- [ ] **Step 3: Write `app/api/wrapped/[user]/route.ts`**

```ts
import { httpStatus } from '@/lib/github';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  try {
    return Response.json(await getWrapped(user));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: httpStatus(e) });
  }
}
```

- [ ] **Step 4: Type-check and smoke test**

Create `.env.local` with a real `GITHUB_TOKEN=...` (no scopes). Run:
`npx tsc --noEmit` — Expected: exit 0.
`npm run dev` then in another shell `curl -s localhost:3000/api/wrapped/torvalds | head -c 400` — Expected: JSON with `"login":"torvalds"`, `total`, `persona`.
`curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/wrapped/this-user-does-not-exist-zzzz9` — Expected: `404`.

- [ ] **Step 5: Commit**

```bash
git add lib/github.ts lib/wrapped.ts app/api
git commit -m "feat: fetch GitHub data and expose wrapped API"
```

---

### Task 5: Story UI, home page, user page

**Files:**
- Create: `components/CountUp.tsx`, `components/Heatmap.tsx`, `components/ShareButtons.tsx` (stub replaced in Task 6), `components/cards/Card.tsx`, `components/cards/Intro.tsx`, `Total.tsx`, `Breakdown.tsx`, `Languages.tsx`, `Repo.tsx`, `Busiest.tsx`, `Streak.tsx`, `PersonaCard.tsx`, `Summary.tsx`, `components/cards/index.tsx`, `components/Story.tsx`, `app/page.tsx`, `app/u/[user]/page.tsx`

**Interfaces:**
- Consumes: `Wrapped`, `getWrapped`, `NotFoundError`, `RateLimitError`.
- Produces: `ShareButtons({ login }: { login: string })` (full version in Task 6), `buildCards(d: Wrapped): ReactNode[]`, `Story({ data }: { data: Wrapped })`.

- [ ] **Step 1: Write `components/CountUp.tsx`, `components/Heatmap.tsx`**

`components/CountUp.tsx`:
```tsx
'use client';
import { animate } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to]);
  return <>{n.toLocaleString('en-US')}</>;
}
```

`components/Heatmap.tsx`:
```tsx
import type { RawDay } from '@/lib/types';

const CELL = 12;

export default function Heatmap({ days }: { days: RawDay[] }) {
  if (!days.length) return null;
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks = Math.ceil((days.length + offset) / 7);
  return (
    <svg className="heatmap" viewBox={`0 0 ${weeks * CELL} ${7 * CELL}`} role="img" aria-label="Contribution heatmap">
      {days.map((d, k) => {
        const idx = k + offset;
        return (
          <rect
            key={d.date}
            x={Math.floor(idx / 7) * CELL}
            y={(idx % 7) * CELL}
            width={CELL - 2}
            height={CELL - 2}
            rx={2}
            fill="var(--accent)"
            opacity={d.count ? 0.25 + 0.75 * (d.count / max) : 0.1}
          />
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 2: Write `components/ShareButtons.tsx` (temporary stub; Task 6 replaces it)**

```tsx
'use client';
export default function ShareButtons({ login }: { login: string }) {
  return <div className="share" data-login={login} />;
}
```

- [ ] **Step 3: Write card components**

`components/cards/Card.tsx`:
```tsx
import type { CSSProperties, ReactNode } from 'react';

export default function Card({ accent, title, children }: { accent: string; title: string; children: ReactNode }) {
  return (
    <section className="card" style={{ '--accent': accent } as CSSProperties}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
```

`components/cards/Intro.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Intro({ d }: { d: Wrapped }) {
  return (
    <Card accent="#58a6ff" title="Your 2026 so far">
      <img className="avatar" src={d.avatarUrl} alt="" />
      <p className="big">{d.name ?? d.login}</p>
      <p className="sub">@{d.login}</p>
      <p className="hint">Tap to continue →</p>
    </Card>
  );
}
```

`components/cards/Total.tsx`:
```tsx
import CountUp from '@/components/CountUp';
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Total({ d }: { d: Wrapped }) {
  return (
    <Card accent="#3fb950" title="Contributions">
      {d.total === 0 ? (
        <p className="sub">No public contributions yet in 2026. The year is young!</p>
      ) : (
        <>
          <p className="big"><CountUp to={d.total} /></p>
          <p className="sub">across {d.activeDays} active days</p>
        </>
      )}
    </Card>
  );
}
```

`components/cards/Breakdown.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Breakdown({ d }: { d: Wrapped }) {
  const rows: [string, number][] = [
    ['Commits', d.commits],
    ['Pull requests', d.prs],
    ['Issues', d.issues],
    ['Reviews', d.reviews],
  ];
  return (
    <Card accent="#f0883e" title="What you did">
      {rows.map(([label, n]) => (
        <div className="row" key={label}>
          <span>{label}</span>
          <b>{n.toLocaleString('en-US')}</b>
        </div>
      ))}
    </Card>
  );
}
```

`components/cards/Languages.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Languages({ d }: { d: Wrapped }) {
  return (
    <Card accent="#d2a8ff" title="Top languages">
      {d.topLanguages.map((l) => (
        <div key={l.name}>
          <div className="lang">{l.name} · {l.pct}%</div>
          <div className="bar" style={{ width: `${l.pct}%`, background: l.color ?? 'var(--accent)' }} />
        </div>
      ))}
    </Card>
  );
}
```

`components/cards/Repo.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Repo({ d }: { d: Wrapped }) {
  return (
    <Card accent="#79c0ff" title="Top repo">
      <p className="big">{d.topRepo?.name.split('/').pop()}</p>
      <p className="sub">{d.topRepo?.commits.toLocaleString('en-US')} commits in {d.topRepo?.name}</p>
    </Card>
  );
}
```

`components/cards/Busiest.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Busiest({ d }: { d: Wrapped }) {
  return (
    <Card accent="#ffa657" title="Busiest day">
      <p className="big">{d.busiestWeekday}</p>
      <p className="sub">
        {d.busiestHour !== null ? `You commit most around ${d.busiestHour}:00 UTC` : 'The day you ship the most'}
      </p>
    </Card>
  );
}
```

`components/cards/Streak.tsx`:
```tsx
import Heatmap from '@/components/Heatmap';
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Streak({ d }: { d: Wrapped }) {
  return (
    <Card accent="#ff7b72" title="Longest streak">
      <p className="big">{d.longestStreak} days</p>
      <p className="sub">in a row</p>
      <Heatmap days={d.days} />
    </Card>
  );
}
```

`components/cards/PersonaCard.tsx`:
```tsx
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function PersonaCard({ d }: { d: Wrapped }) {
  return (
    <Card accent="#f778ba" title="Your persona">
      <p className="big">{d.persona.title}</p>
      <p className="sub">{d.persona.blurb}</p>
    </Card>
  );
}
```

`components/cards/Summary.tsx`:
```tsx
import ShareButtons from '@/components/ShareButtons';
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Summary({ d }: { d: Wrapped }) {
  return (
    <Card accent="#58a6ff" title="That's a wrap">
      <p className="big">{d.persona.title}</p>
      <p className="sub">{d.total.toLocaleString('en-US')} contributions · {d.longestStreak}-day streak</p>
      <ShareButtons login={d.login} />
    </Card>
  );
}
```

`components/cards/index.tsx`:
```tsx
import type { ReactNode } from 'react';
import type { Wrapped } from '@/lib/types';
import Breakdown from './Breakdown';
import Busiest from './Busiest';
import Intro from './Intro';
import Languages from './Languages';
import PersonaCard from './PersonaCard';
import Repo from './Repo';
import Streak from './Streak';
import Summary from './Summary';
import Total from './Total';

export function buildCards(d: Wrapped): ReactNode[] {
  if (d.total === 0) return [<Intro key="i" d={d} />, <Total key="t" d={d} />, <Summary key="s" d={d} />];
  const cards: ReactNode[] = [<Intro key="i" d={d} />, <Total key="t" d={d} />, <Breakdown key="b" d={d} />];
  if (d.topLanguages.length) cards.push(<Languages key="l" d={d} />);
  if (d.topRepo) cards.push(<Repo key="r" d={d} />);
  if (d.busiestWeekday) cards.push(<Busiest key="w" d={d} />);
  cards.push(<Streak key="k" d={d} />, <PersonaCard key="p" d={d} />, <Summary key="s" d={d} />);
  return cards;
}
```

- [ ] **Step 4: Write `components/Story.tsx`**

```tsx
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Wrapped } from '@/lib/types';
import { buildCards } from './cards';

export default function Story({ data }: { data: Wrapped }) {
  const cards = useMemo(() => buildCards(data), [data]);
  const [i, setI] = useState(0);
  const startX = useRef(0);

  const go = (delta: number) => setI((x) => Math.min(cards.length - 1, Math.max(0, x + delta)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length]);

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) return go(dx < 0 ? 1 : -1); // swipe
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1); // tap zones
  };

  return (
    <div className="story" onPointerDown={(e) => (startX.current = e.clientX)} onPointerUp={onPointerUp}>
      <div className="progress">
        {cards.map((_, k) => (
          <i key={k} className={k <= i ? 'done' : ''} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {cards[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 5: Write `app/page.tsx` and `app/u/[user]/page.tsx`**

`app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

async function go(form: FormData) {
  'use server';
  const user = String(form.get('user') ?? '').trim().replace(/^@/, '');
  if (user) redirect(`/u/${encodeURIComponent(user)}`);
}

export default function Home() {
  return (
    <main className="home">
      <h1>GitHub Unwrapped 2026</h1>
      <p>Your year on GitHub, as a story.</p>
      <form action={go}>
        <input name="user" placeholder="github username" autoFocus required />
        <button type="submit">Unwrap</button>
      </form>
    </main>
  );
}
```

`app/u/[user]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Story from '@/components/Story';
import { NotFoundError, RateLimitError } from '@/lib/github';
import { getWrapped } from '@/lib/wrapped';

type Props = { params: Promise<{ user: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user } = await params;
  return { title: `@${user} · GitHub Unwrapped 2026`, description: `${user}'s 2026 on GitHub.` };
}

export default async function Page({ params }: Props) {
  const { user } = await params;
  try {
    return <Story data={await getWrapped(user)} />;
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof RateLimitError) {
      return (
        <main className="home">
          <h1>Too many requests</h1>
          <p>GitHub is rate limiting us. Try again in a few minutes.</p>
          <Link href="/">Back</Link>
        </main>
      );
    }
    throw e;
  }
}
```

Also create `app/not-found.tsx`:
```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="home">
      <h1>User not found</h1>
      <p>Check the username and try again.</p>
      <Link href="/">Back</Link>
    </main>
  );
}
```

- [ ] **Step 6: Type-check and manual check**

Run: `npx tsc --noEmit` — Expected: exit 0.
Run: `npm run dev`, open `http://localhost:3000`, enter `torvalds`.
Expected: story opens; tap right/left, arrow keys and swipe change cards; progress bar fills; Total count-ups; heatmap renders; last card shows persona. `http://localhost:3000/u/this-user-does-not-exist-zzzz9` shows "User not found".

- [ ] **Step 7: Commit**

```bash
git add components app
git commit -m "feat: story UI, home and user pages"
```

---

### Task 6: Share images, OG image, share buttons

**Files:**
- Create: `tests/shareCards.test.ts`, `lib/shareCards.ts`, `lib/shareImage.tsx`, `app/api/card/[user]/[n]/route.ts`, `app/u/[user]/opengraph-image.tsx`
- Modify (overwrite stub): `components/ShareButtons.tsx`

**Interfaces:**
- Consumes: `Wrapped`, `getWrapped`, `httpStatus`, fixture `raw`, `computeStats`, `pickPersona`.
- Produces: `interface ShareCard { title: string; big: string; sub: string; accent: string }`, `shareCards(d: Wrapped): ShareCard[]` (always 5 entries, in order: total, top language, streak, busiest day, persona), `shareImage(d: Wrapped, c: ShareCard): JSX.Element`.

- [ ] **Step 1: Write the failing test `tests/shareCards.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { pickPersona } from '@/lib/persona';
import { shareCards } from '@/lib/shareCards';
import { computeStats } from '@/lib/stats';
import { raw } from './fixture';

describe('shareCards', () => {
  const stats = computeStats(raw);
  const cards = shareCards({ ...stats, persona: pickPersona(stats) });

  it('returns 5 cards in fixed order', () => {
    expect(cards.map((c) => c.title)).toEqual([
      'Total contributions',
      'Top language',
      'Longest streak',
      'Busiest day',
      'Your persona',
    ]);
  });

  it('fills values from stats', () => {
    expect(cards[0].big).toBe('10');
    expect(cards[1].big).toBe('TypeScript');
    expect(cards[2].big).toBe('3 days');
    expect(cards[3].big).toBe('Tuesday');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shareCards.test.ts`
Expected: FAIL (cannot resolve `@/lib/shareCards`).

- [ ] **Step 3: Write `lib/shareCards.ts`**

```ts
import type { Wrapped } from './types';

export interface ShareCard {
  title: string;
  big: string;
  sub: string;
  accent: string;
}

export function shareCards(d: Wrapped): ShareCard[] {
  const lang = d.topLanguages[0];
  return [
    { title: 'Total contributions', big: d.total.toLocaleString('en-US'), sub: `${d.activeDays} active days`, accent: '#3fb950' },
    { title: 'Top language', big: lang?.name ?? '—', sub: lang ? `${lang.pct}% of commits` : 'no commits yet', accent: '#d2a8ff' },
    { title: 'Longest streak', big: `${d.longestStreak} days`, sub: 'in a row', accent: '#ff7b72' },
    {
      title: 'Busiest day',
      big: d.busiestWeekday ?? '—',
      sub: d.busiestHour !== null ? `usually around ${d.busiestHour}:00 UTC` : 'when you ship the most',
      accent: '#ffa657',
    },
    { title: 'Your persona', big: d.persona.title, sub: d.persona.blurb, accent: '#f778ba' },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run`
Expected: PASS (all tests).

- [ ] **Step 5: Write `lib/shareImage.tsx`**

```tsx
import type { ShareCard } from './shareCards';
import type { Wrapped } from './types';

export const IMAGE_SIZE = { width: 1200, height: 630 };

// next/og supports a flexbox-only CSS subset: every container needs display:flex.
export function shareImage(d: Wrapped, c: ShareCard) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        background: '#0d1117',
        color: '#ffffff',
        padding: 64,
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, color: c.accent }}>{`@${d.login} · GitHub Unwrapped 2026`}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 36, color: '#8b949e' }}>{c.title}</div>
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 700, color: c.accent }}>{c.big}</div>
        <div style={{ display: 'flex', fontSize: 36 }}>{c.sub}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Write the card route and OG image**

`app/api/card/[user]/[n]/route.ts` (JSX lives in `lib/shareImage.tsx`, so `.ts` is fine here):
```ts
import { ImageResponse } from 'next/og';
import { httpStatus } from '@/lib/github';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string; n: string }> }) {
  const { user, n } = await params;
  try {
    const d = await getWrapped(user);
    const card = shareCards(d)[Number(n) - 1];
    if (!card) return new Response('Card must be 1-5', { status: 400 });
    return new ImageResponse(shareImage(d, card), IMAGE_SIZE);
  } catch (e) {
    return new Response((e as Error).message, { status: httpStatus(e) });
  }
}
```

`app/u/[user]/opengraph-image.tsx`:
```tsx
import { ImageResponse } from 'next/og';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export const size = IMAGE_SIZE;
export const contentType = 'image/png';
export const alt = 'GitHub Unwrapped 2026';

export default async function Image({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  const d = await getWrapped(user);
  return new ImageResponse(shareImage(d, shareCards(d)[0]), size);
}
```

- [ ] **Step 7: Overwrite `components/ShareButtons.tsx`**

```tsx
'use client';
import { useState } from 'react';

export default function ShareButtons({ login }: { login: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/u/${login}`;

  return (
    <div className="share" onPointerUp={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url());
          setCopied(true);
        }}
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
      <button
        onClick={() => {
          const text = encodeURIComponent('My GitHub Unwrapped 2026');
          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url())}`, '_blank', 'noopener');
        }}
      >
        Share to X
      </button>
      <span className="dl">
        Download card:
        {[1, 2, 3, 4, 5].map((n) => (
          <a key={n} href={`/api/card/${login}/${n}`} download={`${login}-unwrapped-${n}.png`}>
            {n}
          </a>
        ))}
      </span>
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit` — Expected: exit 0. `npm test` — Expected: all PASS.
Run `npm run dev`, then:
`curl -s -o card.png -w "%{http_code} %{content_type}\n" localhost:3000/api/card/torvalds/1` — Expected: `200 image/png`.
`curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/card/torvalds/9` — Expected: `400`.
`curl -s localhost:3000/u/torvalds | grep -o 'og:image" content="[^"]*'` — Expected: an absolute URL ending `/u/torvalds/opengraph-image...`. Delete `card.png` afterwards.
In browser: last story card → Copy link, Share to X open, download links 1–5 save PNGs.

- [ ] **Step 9: Commit**

```bash
git add lib components app tests
git commit -m "feat: share images, OG image and share buttons"
```

---

### Task 7: Production build check

**Files:** none new.

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: build succeeds with no type errors; routes list shows `/`, `/u/[user]`, `/api/wrapped/[user]`, `/api/card/[user]/[n]`.

- [ ] **Step 2: Deploy notes**

On Vercel set env `GITHUB_TOKEN` (token with no scopes). Done; no other config.

- [ ] **Step 3: Commit if build touched tracked files**

```bash
git status --short
```
Expected: clean (build output is in `.gitignore`).
