import { ImageResponse } from 'next/og';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export const size = IMAGE_SIZE;
export const contentType = 'image/png';
export const alt = 'GitHub Unwrapped 2026';

export default async function Image({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  const d = await getWrapped(user);
  return new ImageResponse(shareImage(d, shareCards(d)[0]), size);
}
