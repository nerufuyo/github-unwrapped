export default function Loading() {
  return (
    <div className="story">
      <section className="card" style={{ '--accent': '#58a6ff' } as React.CSSProperties}>
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 220, height: 24 }} />
        <div className="skeleton" style={{ width: 140, height: 24 }} />
      </section>
    </div>
  );
}
