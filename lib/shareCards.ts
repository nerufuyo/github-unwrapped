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
