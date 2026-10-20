'use client';
import { useEffect, useState } from 'react';
import { SHARE_CARD_COUNT } from '@/lib/shareCards';

type CopyState = 'idle' | 'copied' | 'failed';

const LABEL: Record<CopyState, string> = { idle: 'Copy link', copied: 'Copied!', failed: 'Copy failed' };

export default function ShareButtons({ login }: { login: string }) {
  const [copy, setCopy] = useState<CopyState>('idle');
  const url = () => `${window.location.origin}/u/${encodeURIComponent(login)}`;

  useEffect(() => {
    if (copy === 'idle') return;
    const t = setTimeout(() => setCopy('idle'), 2000);
    return () => clearTimeout(t);
  }, [copy]);

  return (
    <div className="share" onPointerUp={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url());
            setCopy('copied');
          } catch {
            setCopy('failed');
          }
        }}
      >
        {LABEL[copy]}
      </button>
      <button
        onClick={() => {
          const text = encodeURIComponent('My GitHub Unwrapped 2026');
          window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url())}`, '_blank', 'noopener');
        }}
      >
        Share to X
      </button>
      <span className="dl">
        Download card:
        {Array.from({ length: SHARE_CARD_COUNT }, (_, i) => i + 1).map((n) => (
          <a key={n} href={`/api/card/${encodeURIComponent(login)}/${n}`} download={`${login}-unwrapped-${n}.png`}>
            {n}
          </a>
        ))}
      </span>
    </div>
  );
}
