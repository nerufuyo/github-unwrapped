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
