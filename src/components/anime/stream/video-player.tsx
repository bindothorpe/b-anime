// components/anime/stream/video-player.tsx
"use client";

import { useRef, useCallback, useEffect } from "react";
import Hls, { Events, ErrorTypes } from "hls.js";
import { HlsError, EpisodeSource } from "@/types/anime";

interface VideoPlayerProps {
  source: EpisodeSource;
  onError: (error: string) => void;
}

export function VideoPlayer({ source, onError }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const initializingRef = useRef(false);

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

          const onHlsError = (_event: Events.ERROR, data: HlsError) => {
            if (data.fatal) {
              switch (data.type) {
                case ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  cleanupHls();
                  onError("Fatal playback error");
                  break;
              }
            }
          };

          const onManifestParsed = () => {
            videoElement.play().catch(console.error);
          };

          hls.on(Events.ERROR, onHlsError);
          hls.on(Events.MANIFEST_PARSED, onManifestParsed);

          hls.loadSource(manifestUrl);
          hls.attachMedia(videoElement);
          hlsRef.current = hls;

          return () => {
            hls.off(Events.ERROR, onHlsError);
            hls.off(Events.MANIFEST_PARSED, onManifestParsed);
          };
        } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
          videoElement.src = manifestUrl;
          videoElement.addEventListener("loadedmetadata", () => {
            videoElement.play().catch(console.error);
          });
        } else {
          onError("HLS playback is not supported in this browser.");
        }
      } catch (error) {
        console.error("HLS initialization error:", error);
        onError("Failed to initialize video player");
      } finally {
        initializingRef.current = false;
      }
    },
    [cleanupHls, onError]
  );

  useEffect(() => {
    if (!source || !videoRef.current) return;

    cleanupHls();

    const selectedSource =
      source.sources.find((s) => s.quality === "1080p") || source.sources[0];
    if (!selectedSource) {
      onError("No valid video source found");
      return;
    }

    const cleanup = initializeHls(videoRef.current, selectedSource.url);

    return () => {
      cleanup?.();
      cleanupHls();
    };
  }, [source, cleanupHls, initializeHls, onError]);

  useEffect(() => {
    return cleanupHls;
  }, [cleanupHls]);

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
      <video ref={videoRef} className="w-full h-full" controls playsInline />
    </div>
  );
}
