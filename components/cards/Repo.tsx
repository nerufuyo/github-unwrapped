import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Repo({ d }: { d: Wrapped }) {
  return (
    <Card accent="#79c0ff" title="Top repo">
      <p className="big">{d.topRepo?.name.split('/').pop()}</p>
      <p className="sub">{d.topRepo?.commits.toLocaleString('en-US')} commits in {d.topRepo?.name}</p>
    </Card>
  );
}
