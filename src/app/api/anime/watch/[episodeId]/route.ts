// app/api/anime/watch/[episodeId]/route.ts
import { ANIME } from '@consumet/extensions';
import { StreamingServers } from '@consumet/extensions/dist/models';

export async function GET(
  request: Request,
  { params }: { params: { episodeId: string } }
) {
  const episodeId = (await params).episodeId;
  const { searchParams } = new URL(request.url);
  const server = searchParams.get('server') as StreamingServers || StreamingServers.GogoCDN;
  
  const gogoanime = new ANIME.Gogoanime();
  
  try {
    const data = await gogoanime.fetchEpisodeSources(episodeId, server);

    // Modify the sources to use our proxy
    const sources = data.sources.map(source => ({
      ...source,
      // Proxy the m3u8 URLs through our API
      url: `/api/proxy?url=${encodeURIComponent(source.url)}`
    }));

    return Response.json({
      headers: data.headers,
      sources,
      download: data.download
    });
  } catch (error) {
    console.error('Error fetching episode:', error);
    return Response.json(
      { error: 'Failed to fetch episode' },
      { status: 500 }
    );
  }
}