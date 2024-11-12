// app/api/anime/[query]/route.ts
import { ANIME } from '@consumet/extensions';

export async function GET(
  request: Request,
  { params }: { params: { query: string } }
) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page')) || 1;
  const decodedQuery = decodeURIComponent(params.query);
  
  const gogoanime = new ANIME.Gogoanime();
  
  try {
    const data = await gogoanime.search(decodedQuery, page);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching anime:', error);
    return Response.json(
      { error: 'Failed to fetch anime' },
      { status: 500 }
    );
  }
}