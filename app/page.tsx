import { redirect } from 'next/navigation';

async function go(form: FormData) {
  'use server';
  const user = String(form.get('user') ?? '').trim().replace(/^@/, '');
  if (user) redirect(`/u/${encodeURIComponent(user)}`);
}

export default function Home() {
  return (
    <main className="home">
      <h1>GitHub Unwrapped 2026</h1>
      <p>Your year on GitHub, as a story.</p>
      <form action={go}>
        <input name="user" placeholder="github username" autoFocus required />
        <button type="submit">Unwrap</button>
      </form>
    </main>
  );
}
