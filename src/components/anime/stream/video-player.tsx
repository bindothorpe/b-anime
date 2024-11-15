"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Hls, { Events, ErrorTypes } from "hls.js";
import { HlsError, EpisodeSource } from "@/types/anime";
import Image from "next/image";

interface VideoPlayerProps {
  source: EpisodeSource;
  onError: (error: string) => void;
  animeCover: string;
  animeTitle: string;
  episodeNumber: string | number;
}

export function VideoPlayer({
  source,
  onError,
  animeCover,
  animeTitle,
  episodeNumber,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const initializingRef = useRef(false);
  const [isPaused, setIsPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const SEEK_TIME = 10;
  const VOLUME_STEP = 0.1;

  // Format time from seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Handle fullscreen changes
  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Handle duration change
  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      setIsPaused(videoRef.current.paused);
    }
  }, []);

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
          handlePlayPause();
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
    [
      shouldIgnoreKeyboardControls,
      toggleFullscreen,
      toggleMute,
      handlePlayPause,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleKeyPress, handleFullscreenChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("play", handlePlayPause);
    video.addEventListener("pause", handlePlayPause);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);

    return () => {
      video.removeEventListener("play", handlePlayPause);
      video.removeEventListener("pause", handlePlayPause);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
    };
  }, [handlePlayPause, handleTimeUpdate, handleDurationChange]);

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
      className="aspect-video w-full bg-black rounded-lg overflow-hidden relative"
    >
      <video
        ref={videoRef}
        className="w-full h-full focus-visible:outline-none"
        controls
        playsInline
      />

      {/* Hide overlay on mobile (<768px), show on md and up */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 pointer-events-none hidden md:block">
          <div
            className={`absolute flex items-center gap-6 p-6 rounded-lg pointer-events-auto
              ${isFullscreen ? "top-12 left-12" : "top-8 left-8"}`}
          >
            <div
              className={`relative rounded-lg overflow-hidden
              ${isFullscreen ? "w-48 h-72" : "w-32 h-48"}`}
            >
              <Image
                src={animeCover}
                alt={animeTitle}
                fill
                className="object-cover"
                sizes={
                  isFullscreen
                    ? "(max-width: 192px) 100vw, 192px"
                    : "(max-width: 128px) 100vw, 128px"
                }
              />
            </div>

            <div className="text-white">
              <h2
                className={`font-bold mb-2 ${
                  isFullscreen ? "text-4xl" : "text-2xl"
                }`}
              >
                {animeTitle}
              </h2>
              <p
                className={`opacity-90 ${
                  isFullscreen ? "text-2xl" : "text-lg"
                }`}
              >
                Episode {episodeNumber}
              </p>
              <p
                className={`opacity-75 mt-2 ${
                  isFullscreen ? "text-lg" : "text-sm"
                }`}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
