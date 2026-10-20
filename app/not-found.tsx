import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="home">
      <h1>User not found</h1>
      <p>Check the username and try again.</p>
      <Link href="/">Back</Link>
    </main>
  );
}
