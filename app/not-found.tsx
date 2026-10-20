import Link from 'next/link';
import UserForm from '@/components/UserForm';

export default function NotFound() {
  return (
    <main className="home">
      <h1>User not found</h1>
      <p>Check the username and try again.</p>
      <UserForm />
      <Link href="/">Back</Link>
    </main>
  );
}
