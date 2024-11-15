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
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const initializingRef = useRef(false);

  const SEEK_TIME = 10;
  const VOLUME_STEP = 0.1;

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

  const shouldIgnoreKeyboardControls = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    return (
      activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      activeElement.getAttribute("contenteditable") === "true" ||
      activeElement.closest('input, textarea, [contenteditable="true"]') !==
        null ||
      activeElement.getAttribute("role") === "searchbox" ||
      activeElement.getAttribute("role") === "textbox"
    );
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  }, []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || shouldIgnoreKeyboardControls()) return;

      const isVideoFocused =
        document.activeElement === video ||
        document.activeElement?.tagName === "VIDEO" ||
        video.contains(document.activeElement);

      if (isVideoFocused && event.code === "Space") {
        return;
      }

      if (
        [
          "Space",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "KeyF",
          "KeyM",
        ].includes(event.code)
      ) {
        event.preventDefault();
      }

      switch (event.code) {
        case "Space":
          if (video.paused) {
            video.play().catch(console.error);
          } else {
            video.pause();
          }
          break;

        case "ArrowLeft":
          video.currentTime = Math.max(0, video.currentTime - SEEK_TIME);
          break;

        case "ArrowRight":
          video.currentTime = Math.min(
            video.duration,
            video.currentTime + SEEK_TIME
          );
          break;

        case "ArrowUp":
          video.volume = Math.min(1, video.volume + VOLUME_STEP);
          break;

        case "ArrowDown":
          video.volume = Math.max(0, video.volume - VOLUME_STEP);
          break;

        case "KeyF":
          toggleFullscreen();
          break;

        case "KeyM":
          toggleMute();
          break;
      }
    },
    [shouldIgnoreKeyboardControls, toggleFullscreen, toggleMute]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

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
    <div
      ref={containerRef}
      className="aspect-video w-full bg-black rounded-lg overflow-hidden"
    >
      <video
        ref={videoRef}
        className="w-full h-full focus-visible:outline-none"
        controls
        playsInline
      />
    </div>
  );
}
