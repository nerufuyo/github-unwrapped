import { ImageResponse } from 'next/og';
import { IMAGE_SIZE, shareImage } from '@/lib/shareImage';
import { shareCards } from '@/lib/shareCards';
import { getWrapped } from '@/lib/wrapped';

export const size = IMAGE_SIZE;
export const contentType = 'image/png';
export const alt = 'GitHub Unwrapped 2026';

export default async function Image({ params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  try {
    const d = await getWrapped(user);
    return new ImageResponse(shareImage(d, shareCards(d)[0]), size);
  } catch {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#0d1117', color: '#fff', fontSize: 72, fontWeight: 700 }}>
          GitHub Unwrapped 2026
        </div>
      ),
      size,
    );
  }
}
