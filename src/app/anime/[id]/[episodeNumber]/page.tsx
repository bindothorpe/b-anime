"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Hls from "hls.js";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface EpisodeSource {
  headers: { [key: string]: string };
  sources: Array<{
    url: string;
    quality: string;
    isM3U8: boolean;
  }>;
  download: string;
}

const currentQuality = "1080p";

// We also get the anime info to be able to keep track of the episode count
interface AnimeInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string;
  description: string;
  genres: string[];
  subOrDub: string;
  type: string;
  status: string;
  otherName: string;
  totalEpisodes: number;
  episodes: Array<{
    id: string;
    number: number;
    url: string;
  }>;
}

const canGoToNextEpisode = (currentEpisode: number, totalEpisodes: number) => {
  return currentEpisode < totalEpisodes;
};

const canGoToPreviousEpisode = (currentEpisode: number) => {
  return currentEpisode > 1;
};

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();

  const animeId = params.id as string;
  const episodeNumber = params.episodeNumber as string;
  const episodeId =
    decodeURIComponent(animeId)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") +
    "-episode-" +
    episodeNumber;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState<EpisodeSource | null>(null);
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Separate cleanup function
  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.load();
    }
  }, []);

  // Separate HLS initialization function
  const initializeHls = useCallback(
    (videoElement: HTMLVideoElement, manifestUrl: string) => {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 20000,
            levelLoadingTimeOut: 20000,
          });

          const onError = (_: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  cleanupHls();
                  setError("Fatal playback error");
                  break;
              }
            }
          };

          const onManifestParsed = () => {
            videoElement.play().catch(console.error);
          };

          hls.on(Hls.Events.ERROR, onError);
          hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);

          hls.loadSource(manifestUrl);
          hls.attachMedia(videoElement);
          hlsRef.current = hls;

          return () => {
            hls.off(Hls.Events.ERROR, onError);
            hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
          };
        } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
          videoElement.src = manifestUrl;
          videoElement.addEventListener("loadedmetadata", () => {
            videoElement.play().catch(console.error);
          });
        } else {
          setError("HLS playback is not supported in this browser.");
        }
      } catch (error) {
        console.error("HLS initialization error:", error);
        setError("Failed to initialize video player");
      } finally {
        initializingRef.current = false;
      }
    },
    [cleanupHls]
  );

  // Data fetching effect
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
  }, [episodeId, animeId]);

  // HLS initialization effect
  useEffect(() => {
    if (!source || !videoRef.current) return;

    cleanupHls();

    const selectedSource =
      source.sources.find((s) => s.quality === "1080p") || source.sources[0];
    if (!selectedSource) {
      setError("No valid video source found");
      return;
    }

    const cleanup = initializeHls(videoRef.current, selectedSource.url);

    return () => {
      cleanup?.();
      cleanupHls();
    };
  }, [source, cleanupHls, initializeHls]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupHls;
  }, [cleanupHls]);

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

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/anime/${animeId}`}>
                      {animeInfo?.title}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <BreadcrumbPage>Episode {episodeNumber}</BreadcrumbPage>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit">
                        <ScrollArea className="h-72 w-28 bg-background">
                          {animeInfo?.episodes.map((episode) => (
                            <Link
                              key={episode.id}
                              href={`/anime/${animeId}/${episode.number}`}
                            >
                              <Button variant="link" className="w-full">
                                Episode {episode.number}
                              </Button>
                            </Link>
                          ))}
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              playsInline
            />
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex justify-between">
              <Button
                className="flex items-center gap-2"
                variant="outline"
                disabled={!canGoToPreviousEpisode(Number(episodeNumber))}
                onClick={() => navigateToEpisode(Number(episodeNumber) - 1)}
              >
                <ChevronLeft className="w-6 h-6" />
                Previous Episode
              </Button>
              <Button
                className="flex items-center gap-2"
                variant="outline"
                disabled={
                  !canGoToNextEpisode(
                    Number(episodeNumber),
                    animeInfo?.totalEpisodes ?? 0
                  )
                }
                onClick={() => navigateToEpisode(Number(episodeNumber) + 1)}
              >
                Next Episode
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WatchSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-40" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
