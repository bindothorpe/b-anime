"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Hls from "hls.js";

interface EpisodeSource {
  headers: { [key: string]: string };
  sources: Array<{
    url: string;
    quality: string;
    isM3U8: boolean;
  }>;
  download: string;
}

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const episodeId = params.episodeId as string;
  const animeId = searchParams.get("anime");
  const episodeNumber = searchParams.get("episode");

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [source, setSource] = useState<EpisodeSource | null>(null);
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
            <span>Episode {episodeNumber}</span>
            {animeId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/anime/${animeId}`)}
              >
                Back to Anime
              </Button>
            )}
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

          <div className="mt-4 flex gap-2">
            {source?.sources
              .filter((s) => s.quality !== "backup" && s.quality !== "default")
              .sort((a, b) => {
                const qualityA = parseInt(a.quality);
                const qualityB = parseInt(b.quality);
                return qualityB - qualityA;
              })
              .map((s) => (
                <Button
                  key={s.quality}
                  variant={currentQuality === s.quality ? "default" : "outline"}
                  onClick={() => setCurrentQuality(s.quality)}
                >
                  {s.quality}
                </Button>
              ))}
          </div>

          {source?.download && (
            <div className="mt-4">
              <Button
                className="w-full"
                onClick={() => window.open(source.download, "_blank")}
              >
                Download Episode
              </Button>
            </div>
          )}
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
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="aspect-video w-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
