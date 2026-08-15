// app/api/anime/info/[id]/route.ts
import { getAnimeInfo } from '@/lib/hianime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const data = await getAnimeInfo(decodeURIComponent(id));
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching anime info:', error);
    return Response.json(
      { error: 'Failed to fetch anime info' },
      { status: 500 }
    );
  }
}
