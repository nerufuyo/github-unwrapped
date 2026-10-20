'use client';
import Link from 'next/link';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="home">
      <h1>Something went wrong</h1>
      <p>Could not load this story. Try again in a moment.</p>
      <button onClick={reset}>Try again</button>
      <Link href="/">Back</Link>
    </main>
  );
}
