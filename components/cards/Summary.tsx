import ShareButtons from '@/components/ShareButtons';
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Summary({ d }: { d: Wrapped }) {
  return (
    <Card accent="#58a6ff" title="That's a wrap">
      <p className="big">{d.persona.title}</p>
      <p className="sub">{d.total.toLocaleString('en-US')} contributions · {d.longestStreak}-day streak</p>
      <ShareButtons login={d.login} />
    </Card>
  );
}
