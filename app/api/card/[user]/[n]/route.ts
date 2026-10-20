import { ImageResponse } from 'next/og';
import { httpStatus } from '@/lib/github';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string; n: string }> }) {
  const { user, n } = await params;
  if (!/^[1-5]$/.test(n)) return new Response('Card must be 1-5', { status: 400 });
  try {
    const d = await getWrapped(user);
    const card = shareCards(d)[Number(n) - 1];
    return new ImageResponse(shareImage(d, card), IMAGE_SIZE);
  } catch (e) {
    const status = httpStatus(e);
    if (status < 500) return new Response((e as Error).message, { status });
    console.error(e);
    return new Response('Internal error', { status: 500 });
  }
}
