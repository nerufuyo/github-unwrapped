'use client';
import { useState } from 'react';

export default function ShareButtons({ login }: { login: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/u/${login}`;

  return (
    <div className="share" onPointerUp={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url());
          setCopied(true);
        }}
      >
        {copied ? 'Copied!' : 'Copy link'}
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
        {[1, 2, 3, 4, 5].map((n) => (
          <a key={n} href={`/api/card/${login}/${n}`} download={`${login}-unwrapped-${n}.png`}>
            {n}
          </a>
        ))}
      </span>
    </div>
  );
}
