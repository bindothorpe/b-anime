// app/api/anime/info/[id]/route.ts
import { ANIME } from '@consumet/extensions';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gogoanime = new ANIME.Gogoanime();
  
  try {
    const data = await gogoanime.fetchAnimeInfo(params.id);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching anime info:', error);
    return Response.json(
      { error: 'Failed to fetch anime info' },
      { status: 500 }
    );
  }
}