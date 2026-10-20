import type { ShareCard } from './shareCards';
import type { Wrapped } from './types';

export const IMAGE_SIZE = { width: 1200, height: 630 };

// next/og supports a flexbox-only CSS subset: every container needs display:flex.
export function shareImage(d: Wrapped, c: ShareCard) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        background: '#0d1117',
        color: '#ffffff',
        padding: 64,
      }}
    >
      <div style={{ display: 'flex', fontSize: 36, color: c.accent }}>{`@${d.login} · GitHub Unwrapped 2026`}</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 36, color: '#8b949e' }}>{c.title}</div>
        <div style={{ display: 'flex', fontSize: 120, fontWeight: 700, color: c.accent }}>{c.big}</div>
        <div style={{ display: 'flex', fontSize: 36 }}>{c.sub}</div>
      </div>
    </div>
  );
}
