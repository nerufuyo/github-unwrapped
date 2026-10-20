'use client';
import { animate } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, to, { duration: 1.2, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [to]);
  return <>{n.toLocaleString('en-US')}</>;
}
