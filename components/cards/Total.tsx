import CountUp from '@/components/CountUp';
import type { Wrapped } from '@/lib/types';
import Card from './Card';

export default function Total({ d }: { d: Wrapped }) {
  return (
    <Card accent="#3fb950" title="Contributions">
      {d.total === 0 ? (
        <p className="sub">No public contributions yet in 2026. The year is young!</p>
      ) : (
        <>
          <p className="big"><CountUp to={d.total} /></p>
          <p className="sub">across {d.activeDays} active days</p>
        </>
      )}
    </Card>
  );
}
