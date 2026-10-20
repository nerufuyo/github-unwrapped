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
