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
