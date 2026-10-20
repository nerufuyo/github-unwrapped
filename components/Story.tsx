'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Wrapped } from '@/lib/types';
import { buildCards } from './cards';

export default function Story({ data }: { data: Wrapped }) {
  const cards = useMemo(() => buildCards(data), [data]);
  const [i, setI] = useState(0);
  const startX = useRef(0);

  const go = (delta: number) => setI((x) => Math.min(cards.length - 1, Math.max(0, x + delta)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards.length]);

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 50) return go(dx < 0 ? 1 : -1); // swipe
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left < rect.width * 0.3 ? -1 : 1); // tap zones
  };

  return (
    <div className="story" onPointerDown={(e) => (startX.current = e.clientX)} onPointerUp={onPointerUp}>
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
