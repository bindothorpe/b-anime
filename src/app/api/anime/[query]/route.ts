// app/api/anime/[query]/route.ts
import { searchAnime } from '@/lib/hianime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ query: string }> }
) {
  const { searchParams } = new URL(request.url);
  const query = (await params).query;
  const page = Number(searchParams.get('page')) || 1;

  try {
    const data = await searchAnime(decodeURIComponent(query), page);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching anime:', error);
    return Response.json(
      { error: 'Failed to fetch anime' },
      { status: 500 }
    );
  }
}
