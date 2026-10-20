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
