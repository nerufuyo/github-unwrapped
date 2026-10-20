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
