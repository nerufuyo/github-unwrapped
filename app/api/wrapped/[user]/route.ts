import { httpStatus } from '@/lib/github';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  try {
    return Response.json(await getWrapped(user));
  } catch (e) {
    const status = httpStatus(e);
    if (status === 404 || status === 429) {
      return Response.json({ error: (e as Error).message }, { status });
    }
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
