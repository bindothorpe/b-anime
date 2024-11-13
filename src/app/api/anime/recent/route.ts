// app/api/anime/info/[id]/route.ts
import { ANIME } from '@consumet/extensions';

export async function GET() {
  const gogoanime = new ANIME.Gogoanime();
  
  try {
    const data = await gogoanime.fetchRecentEpisodes();
    console.log('Recent episodes:', Response.json(data));
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching recent episodes:', error);
    return Response.json(
      { error: 'Failed to fetch recent episodes' },
      { status: 500 }
    );
  }
}