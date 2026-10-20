import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Languages({ d }: { d: Wrapped }) {
  return (
    <Card accent="#d2a8ff" title="Top languages">
      {d.topLanguages.map((l) => (
        <div key={l.name}>
          <div className="lang">{l.name} · {l.pct}%</div>
          <div className="bar" style={{ width: `${l.pct}%`, background: l.color ?? 'var(--accent)' }} />
        </div>
      ))}
    </Card>
  );
}
