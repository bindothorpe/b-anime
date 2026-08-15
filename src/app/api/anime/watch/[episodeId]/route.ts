// app/api/anime/watch/[episodeId]/route.ts
import { getEpisodeList, getEpisodeServers, getEpisodeSources } from '@/lib/hianime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    // Input format: {slug}-episode-{number} (from formatEpisodeId)
    const episodeId = decodeURIComponent(
      (await params).episodeId.split('/').pop() || ''
    );

    // Parse server from query params (optional, e.g. HD-1)
    const { searchParams } = new URL(request.url);
    const server = searchParams.get('server') ?? undefined;

    const sepIndex = episodeId.lastIndexOf('-episode-');
    if (sepIndex === -1) throw new Error('Invalid episode ID format');
    const slug = episodeId.slice(0, sepIndex);
    const episodeNumber = Number(episodeId.slice(sepIndex + '-episode-'.length));
    if (!Number.isFinite(episodeNumber) || episodeNumber < 1) {
      throw new Error('Invalid episode ID format');
    }

    // hianime slugs always end with the numeric anime id
    const animeId = slug.match(/-(\d+)$/)?.[1];
    if (!animeId) throw new Error('Could not resolve anime id from slug');

    const episodes = await getEpisodeList(animeId);
    const episode =
      episodes.find((e) => e.number === episodeNumber) ??
      episodes[episodes.length - 1];
    if (!episode) throw new Error('Episode not found');

    const servers = await getEpisodeServers(episode.id);
    const data = await getEpisodeSources(episode.id, server, servers);

    // Non-zokoanime CDNs (e.g. megaplay.buzz streams) need their own Referer —
    // pass it to the proxy via `ref`; zokoanime keeps the proxy's default
    const referer = data.headers?.Referer;
    const refSuffix =
      referer && new URL(referer).hostname !== 'zokoanime.video'
        ? `&ref=${encodeURIComponent(referer)}`
        : '';

    const sources = [
      {
        url: data.url.startsWith('http')
          ? `/api/proxy?url=${encodeURIComponent(data.url)}&type=m3u8${refSuffix}`
          : data.url,
        quality: data.quality,
        isM3U8: data.isM3U8,
      },
    ];

    // Subtitle tracks: proxy VTTs so the browser can fetch them cross-origin
    const subtitles = (data.subtitles ?? []).map((sub) => ({
      ...sub,
      src: sub.src.startsWith('http')
        ? `/api/proxy?url=${encodeURIComponent(sub.src)}&type=ts${refSuffix}`
        : sub.src,
    }));

    return Response.json({
      headers: data.headers ?? {},
      sources,
      download: data.download ?? '',
      subtitles,
      servers: servers.map((s) => s.name),
    });
  } catch (error) {
    console.error('Error in watch route:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch episode' },
      { status: 500 }
    );
  }
}
