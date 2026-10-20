'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Wrapped } from '@/lib/types';
import { buildCards } from './cards';

export default function Story({ data }: { data: Wrapped }) {
  const cards = useMemo(() => buildCards(data), [data]);
  const [i, setI] = useState(0);
  const startX = useRef(0);
  const down = useRef(false);

  const go = useCallback(
    (delta: number) => setI((x) => Math.min(cards.length - 1, Math.max(0, x + delta))),
    [cards.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    down.current = true;
    startX.current = e.clientX;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (!down.current) return;
    down.current = false;
    if ((e.target as HTMLElement).closest('button,a,input')) return; // interactive children handle their own clicks
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) return go(dx < 0 ? 1 : -1); // swipe
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1); // tap zones
  };

  const onPointerCancel = () => {
    down.current = false;
  };

  return (
    <div className="story" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
      <div className="progress">
        {cards.map((_, k) => (
          <i key={k} className={k <= i ? 'done' : ''} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          style={{ position: 'absolute', inset: 0 }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {cards[i]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
