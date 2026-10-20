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
