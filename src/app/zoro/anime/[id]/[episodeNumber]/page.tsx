"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWatchData } from "@/hooks/use-watch-data";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimeInfo, Episode } from "@/types/zoro/anime-info";
import { SourceResponse, SubtitleSource } from "@/types/zoro/source-response";
import { VideoPlayer } from "@/components/zoro/anime/stream/video-player";
import EpisodeButtonGrid from "@/components/zoro/anime/episode-button-grid";
import { EpisodeNavigation } from "@/components/zoro/anime/stream/episode-navigation";
import { EpisodeBreadcrumb } from "@/components/zoro/anime/stream/episode-breadcrumb";
import { useZoro } from "@/hooks/use-zoro";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();

  const animeId = params.id as string;
  const episodeNumber = params.episodeNumber as string;

  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [sourceResponse, setSourceResponse] = useState<SourceResponse | null>(
    null
  );
  const [sourceLoading, setSourceLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const { isWatched, updateSecondsWatched, updateDuration } = useWatchData();
  const { getEpisodeSource, getAnimeInfo } = useZoro();

  // Fetch episode source
  useEffect(() => {
    if (!episode) return;
    if (!episodeId) return;
    const fetchEpisodeSource = async () => {
      setSourceLoading(true);
      setSourceError(null);

      const response = await getEpisodeSource(episodeId);

      if (response.hasError) {
        console.error(response.error);
        setSourceError(
          response.error ? response.error.message : "Unknown error"
        );
      } else {
        setSourceResponse(response.data);
      }

      setSourceLoading(false);
    };

    fetchEpisodeSource();
  }, [episode, episodeId]);

  // Fetch anime info
  useEffect(() => {
    const fetchAnimeInfo = async () => {
      setInfoLoading(true);
      setInfoError(null);

      const response = await getAnimeInfo(animeId);

      if (response.hasError) {
        console.error(response.error);
        setInfoError(response.error ? response.error.message : "Unknown error");
      } else {
        setAnimeInfo(response.data);
        const episode = response.data?.episodes.find(
          (e) => e.number === Number(episodeNumber)
        ) as Episode | undefined;
        if (!episode) {
          throw new Error("Episode not found");
        }
        setEpisodeId(episode.id);
        setEpisode(episode);
      }

      setInfoLoading(false);
    };

    fetchAnimeInfo();
  }, [animeId]);

  const navigateToEpisode = useCallback(
    (episode: number) => {
      router.push(`/zoro/anime/${animeId}/${episode}`);
    },
    [animeId, router]
  );

  // Show error if both fetches failed
  if (sourceError && infoError) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">Failed to load content</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {infoLoading ? (
              <Skeleton className="w-40 h-8" />
            ) : animeInfo ? (
              <EpisodeBreadcrumb
                animeInfo={animeInfo}
                episodeNumber={episodeNumber}
                animeId={animeId}
              />
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sourceLoading ? (
            <Skeleton className="aspect-video" />
          ) : sourceResponse ? (
            <VideoPlayer
              sourceResponse={sourceResponse}
              onError={setSourceError}
              animeTitle={animeInfo?.title || "Loading..."}
              episodeNumber={episodeNumber}
              onUpdateProgress={(seconds) =>
                updateSecondsWatched(animeId, episodeNumber, seconds)
              }
              onDurationFound={(duration) =>
                updateDuration(animeId, episodeNumber, duration)
              }
              animeId={animeId}
              episodeId={episodeNumber}
              subtitleUrl={
                sourceResponse.subtitles?.find(
                  (s: SubtitleSource) => s.lang == "English"
                )?.url
              }
            />
          ) : (
            <div className="text-center p-4">Failed to load video</div>
          )}

          {infoLoading ? (
            <>
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex justify-between">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton className="w-20 h-6" />
              </div>
              <div className=" mt-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton key={index} className="w-fill h-10" />
                ))}
              </div>
            </>
          ) : (
            animeInfo && (
              <>
                <div className="my-4 flex flex-col gap-4">
                  <EpisodeNavigation
                    episodeNumber={Number(episodeNumber)}
                    animeInfo={animeInfo}
                    onNavigate={navigateToEpisode}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Episodes</h3>
                  <EpisodeButtonGrid
                    animeId={animeId}
                    episodes={animeInfo.episodes}
                    isWatched={isWatched}
                  />
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
