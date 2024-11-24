"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Hls, { Events, ErrorTypes } from "hls.js";
import { HlsError, EpisodeSource } from "@/types/anime";
import Image from "next/image";

interface VideoPlayerProps {
  source: EpisodeSource;
  onError: (error: string) => void;
  animeCover: string | undefined;
  animeTitle: string | undefined;
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
  const sourceUrlRef = useRef<string | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const SEEK_TIME = 10;
  const VOLUME_STEP = 0.1;

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

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
      console.log("Cleaning up HLS instance");
      hlsRef.current.destroy();
      hlsRef.current = null;
      sourceUrlRef.current = null;
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

  useEffect(() => {
    if (!source || !videoRef.current) return;

    const selectedSource =
      source.sources.find((s) => s.quality === "1080p") || source.sources[0];

    if (!selectedSource) {
      onError("No valid video source found");
      return;
    }

    // Skip initialization if we're already playing this source
    if (sourceUrlRef.current === selectedSource.url && hlsRef.current) {
      console.log("Source already initialized, skipping...");
      return;
    }

    console.log("Initializing new source:", selectedSource.url);

    // Clean up existing instance
    cleanupHls();

    const initializeHls = () => {
      if (!videoRef.current) return;

      try {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            fragLoadingTimeOut: 20000,
            manifestLoadingTimeOut: 20000,
            levelLoadingTimeOut: 20000,
            startLevel: -1,
          });

          const onHlsError = (_event: Events.ERROR, data: HlsError) => {
            if (!data.fatal) return;

            switch (data.type) {
              case ErrorTypes.NETWORK_ERROR:
                console.log("Network error, attempting to recover...");
                hls.startLoad();
                break;
              case ErrorTypes.MEDIA_ERROR:
                console.log("Media error, attempting to recover...");
                hls.recoverMediaError();
                break;
              default:
                console.error("Fatal error:", data);
                cleanupHls();
                onError("Fatal playback error");
                break;
            }
          };

          const onManifestParsed = () => {
            console.log("Manifest parsed, starting playback");
            sourceUrlRef.current = selectedSource.url;
            videoRef.current?.play().catch(console.error);
          };

          hls.on(Events.ERROR, onHlsError);
          hls.on(Events.MANIFEST_PARSED, onManifestParsed);

          hls.loadSource(selectedSource.url);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
        } else if (
          videoRef.current.canPlayType("application/vnd.apple.mpegurl")
        ) {
          console.log("Using native HLS playback");
          videoRef.current.src = selectedSource.url;
          sourceUrlRef.current = selectedSource.url;
        } else {
          onError("HLS playback is not supported in this browser.");
        }
      } catch (error) {
        console.error("HLS initialization error:", error);
        onError("Failed to initialize video player");
      }
    };

    // Initialize with a slight delay to avoid race conditions
    const timeoutId = setTimeout(initializeHls, 0);

    return () => {
      clearTimeout(timeoutId);
      if (sourceUrlRef.current !== selectedSource.url) {
        cleanupHls();
      }
    };
  }, [source, cleanupHls, onError]);

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
              {/* <Image
                src={animeCover}
                alt={animeTitle}
                fill
                className="object-cover"
                sizes={
                  isFullscreen
                    ? "(max-width: 192px) 100vw, 192px"
                    : "(max-width: 128px) 100vw, 128px"
                }
              /> */}
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
