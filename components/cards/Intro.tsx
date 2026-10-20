import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Intro({ d }: { d: Wrapped }) {
  return (
    <Card accent="#58a6ff" title="Your 2026 so far">
      <img className="avatar" src={d.avatarUrl} alt="" />
      <p className="big">{d.name ?? d.login}</p>
      <p className="sub">@{d.login}</p>
      <p className="hint">Tap to continue →</p>
    </Card>
  );
}
