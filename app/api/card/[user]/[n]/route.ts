import { ImageResponse } from 'next/og';
import { httpStatus } from '@/lib/github';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { SHARE_CARD_COUNT, shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string; n: string }> }) {
  const { user, n } = await params;
  const idx = Number(n);
  if (!/^\d+$/.test(n) || idx < 1 || idx > SHARE_CARD_COUNT) {
    return new Response(`Card must be 1-${SHARE_CARD_COUNT}`, { status: 400 });
  }
  try {
    const d = await getWrapped(user);
    const card = shareCards(d)[idx - 1];
    return new ImageResponse(shareImage(d, card), IMAGE_SIZE);
  } catch (e) {
    const status = httpStatus(e);
    if (status < 500) return new Response((e as Error).message, { status });
    console.error(e);
    return new Response('Internal error', { status: 500 });
  }
}
