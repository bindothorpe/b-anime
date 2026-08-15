"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/anime/stream/video-player";
import { EpisodeNavigation } from "@/components/anime/stream/episode-navigation";
import { EpisodeBreadcrumb } from "@/components/anime/stream/episode-breadcrumb";
import { formatEpisodeId } from "@/utils/episode";
import { EpisodeSource, AnimeInfo } from "@/types/anime";
import { useWatchData } from "@/hooks/use-watch-data";
import EpisodeButtonGrid from "@/components/anime/episode-button-grid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import * as ls from "@/lib/storage";

// Per-anime preferred stream server, e.g. { "heavenly-delusion-884": "HD-2" }
const PREFERRED_SERVER_KEY = "anime_preferred_server";

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();

  const animeId = params.id as string;
  const episodeNumber = params.episodeNumber as string;
  const episodeId = formatEpisodeId(animeId, episodeNumber);

  const [source, setSource] = useState<EpisodeSource | null>(null);
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [infoLoading, setInfoLoading] = useState(true);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  // null = route default (first server); set when the user picks one
  const [server, setServer] = useState<string | null>(null);
  const [availableServers, setAvailableServers] = useState<string[]>([]);
  const { isWatched, updateSecondsWatched, updateDuration } = useWatchData();

  // Fetch episode source
  useEffect(() => {
    let cancelled = false;
    const fetchEpisodeSource = async () => {
      try {
        setSourceLoading(true);
        setSourceError(null);

        // No explicit choice yet: fall back to the preferred server for this
        // anime (stored when the user last picked one)
        let effectiveServer = server;
        if (effectiveServer === null) {
          const prefs = ls.get<Record<string, string>>(PREFERRED_SERVER_KEY);
          effectiveServer = prefs?.[animeId] ?? null;
        }

        const url = effectiveServer
          ? `/api/anime/watch/${episodeId}?server=${encodeURIComponent(effectiveServer)}`
          : `/api/anime/watch/${episodeId}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch episode source");
        }

        const data = await response.json();
        if (cancelled) return;

        setAvailableServers(data.servers ?? []);
        // First load with a stored preference that isn't the default server:
        // pin it so the source refetches from it
        if (
          server === null &&
          effectiveServer &&
          data.servers?.length > 1 &&
          data.servers[0] !== effectiveServer &&
          data.servers.includes(effectiveServer)
        ) {
          setServer(effectiveServer);
          return;
        }
        setSource(data);
      } catch (error) {
        console.error("Error fetching episode:", error);
        if (!cancelled) {
          setSourceError(
            error instanceof Error ? error.message : "Failed to load episode"
          );
        }
      } finally {
        if (!cancelled) setSourceLoading(false);
      }
    };

    fetchEpisodeSource();
    return () => {
      cancelled = true;
    };
  }, [episodeId, server, animeId]);

  const handleServerSelect = (name: string) => {
    setServer(name);
    const prefs = ls.get<Record<string, string>>(PREFERRED_SERVER_KEY) ?? {};
    ls.set(PREFERRED_SERVER_KEY, { ...prefs, [animeId]: name });
  };

  // Fetch anime info
  useEffect(() => {
    const fetchAnimeInfo = async () => {
      try {
        setInfoLoading(true);
        setInfoError(null);

        const response = await fetch(`/api/anime/info/${animeId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch anime info");
        }

        const data = await response.json();
        setAnimeInfo(data);
      } catch (error) {
        console.error("Error fetching anime info:", error);
        setInfoError(
          error instanceof Error
            ? error.message
            : "Failed to load anime information"
        );
      } finally {
        setInfoLoading(false);
      }
    };

    fetchAnimeInfo();
  }, [animeId]);

  const navigateToEpisode = useCallback(
    (episode: number) => {
      router.push(`/anime/${animeId}/${episode}`);
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
            {availableServers.length > 1 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={sourceLoading}>
                    Server: {server ?? availableServers[0]}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit" align="end">
                  <div className="flex flex-col gap-1">
                    {availableServers.map((name) => (
                      <Button
                        key={name}
                        variant={
                          (server ?? availableServers[0]) === name
                            ? "default"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() => handleServerSelect(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sourceLoading ? (
            <Skeleton className="aspect-video" />
          ) : source ? (
            <VideoPlayer
              key={server ?? availableServers[0]}
              source={source}
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
                    totalEpisodes={animeInfo.totalEpisodes}
                    onNavigate={navigateToEpisode}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Episodes</h3>
                  <EpisodeButtonGrid
                    episodeButtonProps={animeInfo.episodes.map((episode) => ({
                      animeId: animeId,
                      episodeNumber: episode.number.toString(),
                      isWatched: isWatched,
                    }))}
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
