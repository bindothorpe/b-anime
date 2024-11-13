"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
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

  const episodeId = `${animeId}-episode-${episodeNumber}`;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState<EpisodeSource | null>(null);
  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuality, setCurrentQuality] = useState<string>("1080p");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        const response = await fetch(`/api/anime/watch/${episodeId}`);
        if (!response.ok) throw new Error("Failed to fetch episode data");
        const data = await response.json();
        setSource(data);

        const animeResponse = await fetch(`/api/anime/info/${animeId}`);
        if (!animeResponse.ok) throw new Error("Failed to fetch anime data");
        const animeData = await animeResponse.json();
        setAnimeInfo(animeData);
      } catch (error) {
        console.error("Error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load episode"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEpisode();
  }, [episodeId]);

  useEffect(() => {
    if (!source || !videoRef.current) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const selectedSource =
      source.sources.find((s) => s.quality === currentQuality) ||
      source.sources[0]; // Fallback to first source if quality not found

    if (!selectedSource) {
      setError("No valid video source found");
      return;
    }

    const initializeHLS = (
      videoElement: HTMLVideoElement,
      manifestUrl: string
    ) => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          debug: true,
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferSize: 0,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1,
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 2,
          fragLoadingMaxRetry: 2,
          manifestLoadingRetryDelay: 1000,
          levelLoadingRetryDelay: 1000,
          fragLoadingRetryDelay: 1000,
          manifestLoadingTimeOut: 10000,
          levelLoadingTimeOut: 10000,
          fragLoadingTimeOut: 20000,
          // Improve streaming performance
          testBandwidth: true,
          progressive: true,
          autoStartLoad: true,
          startFragPrefetch: true,
          loader: Hls.DefaultConfig.loader,
          xhrSetup: (xhr, url) => {
            let finalUrl = url;

            // Don't proxy already proxied URLs
            if (!url.startsWith("/api/proxy")) {
              const type = url.endsWith(".ts") ? "ts" : "m3u8";
              finalUrl = `/api/proxy?url=${encodeURIComponent(
                url
              )}&type=${type}`;
            }

            xhr.open("GET", finalUrl, true);

            // Add custom headers if needed
            Object.entries(source.headers || {}).forEach(([key, value]) => {
              xhr.setRequestHeader(key, value);
            });
          },
        });

        // Error handling
        hls.on(Hls.Events.ERROR, function (event, data) {
          console.log("HLS error:", data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Try to recover network error
                console.log("Network error, trying to recover...");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log("Media error, trying to recover...");
                hls.recoverMediaError();
                break;
              default:
                // Cannot recover
                console.log("Fatal error, destroying HLS instance");
                hls.destroy();
                setError("Failed to load video. Please try again.");
                break;
            }
          }
        });

        // Loading events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log("HLS Manifest parsed");
          videoElement.play().catch(console.error);
        });

        hls.on(Hls.Events.LEVEL_LOADED, () => {
          console.log("HLS Level loaded");
        });

        // Load the manifest
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(
          manifestUrl
        )}&type=m3u8`;
        hls.loadSource(proxyUrl);
        hls.attachMedia(videoElement);
        hlsRef.current = hls;

        // Add error handler for video element
        videoElement.onerror = (e) => {
          console.error("Video element error:", e);
          setError("Video playback error. Please try again.");
        };
      } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
        // For Safari
        videoElement.src = `/api/proxy?url=${encodeURIComponent(
          manifestUrl
        )}&type=m3u8`;
        videoElement.onerror = (e) => {
          console.error("Video element error:", e);
          setError("Video playback error. Please try again.");
        };
      } else {
        setError("HLS playback is not supported in this browser.");
      }
    };

    try {
      initializeHLS(videoRef.current, selectedSource.url);
    } catch (err) {
      console.error("Error initializing HLS:", err);
      setError("Failed to initialize video player");
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source, currentQuality]);

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
