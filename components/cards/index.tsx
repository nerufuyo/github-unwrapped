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
