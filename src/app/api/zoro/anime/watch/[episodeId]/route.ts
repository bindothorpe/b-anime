
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
    const server = searchParams.get('server') as StreamingServers || StreamingServers.VidCloud;

    console.log('Fetching episode:', episodeId, 'from server:', server); // Debug log

    const zoro = new ANIME.Zoro();
    
    const data = await zoro.fetchEpisodeSources(episodeId, server);

    // Map sources to include proxy
    const sources = data.sources.map(source => ({
      ...source,
      url: source.url.startsWith('http') 
        ? `/api/zoro/proxy?url=${encodeURIComponent(source.url)}&type=m3u8`
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