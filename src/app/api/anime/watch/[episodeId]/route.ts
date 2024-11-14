// app/api/anime/watch/[episodeId]/route.ts
import { ANIME } from '@consumet/extensions';
import { StreamingServers } from '@consumet/extensions/dist/models';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    // Extract the episode ID from the path
    const episodeId = (await params).episodeId;
    
    // Parse server from query params (optional)
    const { searchParams } = new URL(request.url);
    const server = searchParams.get('server') as StreamingServers || StreamingServers.GogoCDN;

    console.log('Fetching episode:', episodeId, 'from server:', server); // Debug log

    const gogoanime = new ANIME.Gogoanime();
    
    // The episodeId needs to be formatted properly for the API
    // Format: anime-name-episode-number
    // Example: one-piece-episode-1000
    
    // Remove any additional path segments and clean the ID
    const cleanEpisodeId = episodeId
      .split('/').pop() // Get last segment
      ?.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    
    if (!cleanEpisodeId) {
      throw new Error('Invalid episode ID format');
    }

    console.log('Cleaned episode ID:', cleanEpisodeId); // Debug log

    const data = await gogoanime.fetchEpisodeSources(cleanEpisodeId, server);

    // Map sources to include proxy
    const sources = data.sources.map(source => ({
      ...source,
      url: source.url.startsWith('http') 
        ? `/api/proxy?url=${encodeURIComponent(source.url)}&type=m3u8`
        : source.url
    }));

    return Response.json({
      headers: data.headers,
      sources,
      download: data.download
    });
  } catch (error) {
    console.error('Error in watch route:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch episode' },
      { status: 500 }
    );
  }
}