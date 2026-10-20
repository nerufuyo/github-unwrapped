import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Breakdown({ d }: { d: Wrapped }) {
  const rows: [string, number][] = [
    ['Commits', d.commits],
    ['Pull requests', d.prs],
    ['Issues', d.issues],
    ['Reviews', d.reviews],
  ];
  return (
    <Card accent="#f0883e" title="What you did">
      {rows.map(([label, n]) => (
        <div className="row" key={label}>
          <span>{label}</span>
          <b>{n.toLocaleString('en-US')}</b>
        </div>
      ))}
    </Card>
  );
}
