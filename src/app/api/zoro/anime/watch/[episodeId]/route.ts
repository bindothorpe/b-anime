import { ANIME } from "@consumet/extensions";
import { StreamingServers } from "@consumet/extensions/dist/models";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ episodeId: string }> }
) {
  try {
    // Extract the episode ID from the path
    const episodeId = (await params).episodeId;

    // Parse server from query params (optional)
    const { searchParams } = new URL(request.url);
    const server =
      (searchParams.get("server") as StreamingServers) ||
      StreamingServers.VidCloud;

    const zoro = new ANIME.Zoro();
    let data;

    // List of servers to try in order if the initial server fails
    const fallbackServers = [
      StreamingServers.VidCloud,
      StreamingServers.VidStreaming,
      StreamingServers.StreamSB,
      StreamingServers.MyCloud,
      StreamingServers.StreamHub,
      StreamingServers.AsianLoad,
      StreamingServers.Filemoon,
      StreamingServers.GogoCDN,
      StreamingServers.MixDrop,
      StreamingServers.Mp4Upload,
      StreamingServers.SmashyStream
    ];

    // Remove the initial server from fallbacks if it's already in the list
    // to avoid trying it twice
    const serverQueue = [
      server,
      ...fallbackServers.filter((_server) => _server !== server),
    ];

    let error = null;

    for (const currentServer of serverQueue) {
      try {
        data = await zoro.fetchEpisodeSources(episodeId, currentServer);
        // If successful, break out of the loop
        if (data) {
          console.log(`Successfully fetched from ${currentServer}`);
          break;
        }
      } catch (err) {
        console.error(`Error fetching from ${currentServer}:`, err);
        error = err;
        // Continue to next server if this one fails
        continue;
      }
    }

    if (!data) {
      throw (
        error || new Error("Failed to fetch episode sources from all servers")
      );
    }

    // Map sources to include proxy
    const sources = data.sources.map((source) => ({
      ...source,
      url: source.url.startsWith("http")
        ? `/api/zoro/proxy?url=${encodeURIComponent(source.url)}&type=m3u8`
        : source.url,
    }));

    return Response.json({
      sources,
      subtitles: data.subtitles,
      intro: data.intro,
      outro: data.outro,
    });
  } catch (error) {
    console.error("Error in watch route:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch episode",
      },
      { status: 500 }
    );
  }
}
