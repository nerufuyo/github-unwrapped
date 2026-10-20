import type { RawDay } from '@/lib/types';

const CELL = 12;

export default function Heatmap({ days }: { days: RawDay[] }) {
  if (!days.length) return null;
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks = Math.ceil((days.length + offset) / 7);
  return (
    <svg className="heatmap" viewBox={`0 0 ${weeks * CELL} ${7 * CELL}`} role="img" aria-label="Contribution heatmap">
      {days.map((d, k) => {
        const idx = k + offset;
        return (
          <rect
            key={d.date}
            x={Math.floor(idx / 7) * CELL}
            y={(idx % 7) * CELL}
            width={CELL - 2}
            height={CELL - 2}
            rx={2}
            fill="var(--accent)"
            opacity={d.count ? 0.25 + 0.75 * (d.count / max) : 0.1}
          />
        );
      })}
    </svg>
  );
}
