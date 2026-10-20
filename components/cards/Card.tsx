import type { CSSProperties, ReactNode } from 'react';

export default function Card({ accent, title, children }: { accent: string; title: string; children: ReactNode }) {
  return (
    <section className="card" style={{ '--accent': accent } as CSSProperties}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
