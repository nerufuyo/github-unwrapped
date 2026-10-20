import { ImageResponse } from 'next/og';
import { httpStatus } from '@/lib/github';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string; n: string }> }) {
  const { user, n } = await params;
  try {
    const d = await getWrapped(user);
    const card = shareCards(d)[Number(n) - 1];
    if (!card) return new Response('Card must be 1-5', { status: 400 });
    return new ImageResponse(shareImage(d, card), IMAGE_SIZE);
  } catch (e) {
    return new Response((e as Error).message, { status: httpStatus(e) });
  }
}
