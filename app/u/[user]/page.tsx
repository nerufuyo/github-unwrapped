import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Story from '@/components/Story';
import { NotFoundError, RateLimitError } from '@/lib/github';
import { getWrapped } from '@/lib/wrapped';

type Props = { params: Promise<{ user: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user } = await params;
  return { title: `@${user} · GitHub Unwrapped 2026`, description: `${user}'s 2026 on GitHub.` };
}

export default async function Page({ params }: Props) {
  const { user } = await params;
  try {
    return <Story data={await getWrapped(user)} />;
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    if (e instanceof RateLimitError) {
      return (
        <main className="home">
          <h1>Too many requests</h1>
          <p>GitHub is rate limiting us. Try again in a few minutes.</p>
          <Link href="/">Back</Link>
        </main>
      );
    }
    throw e;
  }
}
