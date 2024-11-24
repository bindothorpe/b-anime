// app/anime/[id]/[episodeNumber]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/anime/stream/video-player";
import { EpisodeNavigation } from "@/components/anime/stream/episode-navigation";
import { EpisodeBreadcrumb } from "@/components/anime/stream/episode-breadcrumb";
import { WatchSkeleton } from "@/components/anime/stream/watch-skeleton";
import { formatEpisodeId } from "@/utils/episode";
import { EpisodeSource, AnimeInfo } from "@/types/anime";
import { useWatchData } from "@/hooks/use-watch-data";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();

  const animeId = params.id as string;
  const episodeNumber = params.episodeNumber as string;
  const episodeId = formatEpisodeId(animeId, episodeNumber);

  const [source, setSource] = useState<EpisodeSource | null>(null);
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { markWatched } = useWatchData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [episodeResponse, animeResponse] = await Promise.all([
          fetch(`/api/anime/watch/${episodeId}`),
          fetch(`/api/anime/info/${animeId}`),
        ]);

        if (!episodeResponse.ok || !animeResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        const episodeData = await episodeResponse.json();
        const animeData = await animeResponse.json();

        setSource(episodeData);
        setAnimeInfo(animeData);
      } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    console.log("Marking as watched", animeId, episodeNumber);
    markWatched(animeId, episodeNumber);
  }, [episodeId, animeId]);

  const navigateToEpisode = (episode: number) => {
    router.push(`/anime/${animeId}/${episode}`);
  };

  if (isLoading) {
    return <WatchSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!source || !animeInfo) return null;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <EpisodeBreadcrumb
              animeInfo={animeInfo}
              episodeNumber={episodeNumber}
              animeId={animeId}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VideoPlayer
            source={source}
            onError={setError}
            animeCover={animeInfo.image}
            animeTitle={animeInfo.title}
            episodeNumber={episodeNumber}
          />
          <div className="mt-4 flex flex-col gap-4">
            <EpisodeNavigation
              episodeNumber={Number(episodeNumber)}
              totalEpisodes={animeInfo.totalEpisodes}
              onNavigate={navigateToEpisode}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
