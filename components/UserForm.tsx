import { redirect } from 'next/navigation';

async function go(form: FormData) {
  'use server';
  const user = String(form.get('user') ?? '').trim().replace(/^@/, '');
  if (user) redirect(`/u/${encodeURIComponent(user)}`);
}

export default function UserForm() {
  return (
    <form action={go}>
      <input name="user" placeholder="github username" autoFocus required />
      <button type="submit">Unwrap</button>
    </form>
  );
}
