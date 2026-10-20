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
