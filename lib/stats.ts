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
