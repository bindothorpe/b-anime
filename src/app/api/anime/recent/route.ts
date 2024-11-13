// app/api/anime/recent/route.ts
import { ANIME } from '@consumet/extensions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const type = Number(searchParams.get('type')) || 1;
  const page = Number(searchParams.get('page')) || 1;

  const gogoanime = new ANIME.Gogoanime();
  
  try {
    const data = await gogoanime.fetchRecentEpisodes(page, type);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching recent episodes:', error);
    return Response.json(
      { error: 'Failed to fetch recent episodes' },
      { status: 500 }
    );
  }
}