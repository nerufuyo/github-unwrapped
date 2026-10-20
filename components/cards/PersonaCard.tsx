import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function PersonaCard({ d }: { d: Wrapped }) {
  return (
    <Card accent="#f778ba" title="Your persona">
      <p className="big">{d.persona.title}</p>
      <p className="sub">{d.persona.blurb}</p>
    </Card>
  );
}
