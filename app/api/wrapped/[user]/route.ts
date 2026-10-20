import { httpStatus } from '@/lib/github';
import { getWrapped } from '@/lib/wrapped';

export async function GET(_: Request, { params }: { params: Promise<{ user: string }> }) {
  const { user } = await params;
  try {
    return Response.json(await getWrapped(user));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: httpStatus(e) });
  }
}
