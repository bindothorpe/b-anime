"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Hls, { Events, ErrorTypes } from "hls.js";
import { HlsError, EpisodeSource } from "@/types/anime";
import * as ls from "local-storage";

interface VideoPlayerProps {
  source: EpisodeSource;
  onError: (error: string) => void;
  animeTitle: string | undefined;
  episodeNumber: string | number;
  onUpdateProgress: (seconds: number) => void;
  onDurationFound: (duration: number) => void;
  animeId: string;
  episodeId: string;
}

export function VideoPlayer({
  source,
  onError,
  animeTitle,
  episodeNumber,
  onUpdateProgress,
  onDurationFound,
  animeId,
  episodeId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const initialSeekPerformed = useRef<boolean>(false);
  const [isPaused, setIsPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const SEEK_TIME = 10;
  const VOLUME_STEP = 0.1;
  const SAVE_INTERVAL = 10; // Minimum seconds between saves
  const STORAGE_KEY = "anime_watch_data";

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getStoredTime = useCallback(() => {
    const watchData = ls.get<{
      anime: Array<{
        id: string;
        episodes: Array<{
          id: string;
          secondsWatched: number;
        }>;
      }>;
    }>(STORAGE_KEY);

    if (!watchData) return 0;

    const anime = watchData.anime.find((a) => a.id === animeId);
    if (!anime) return 0;

    const episode = anime.episodes.find((e) => e.id === episodeId);
    return episode ? episode.secondsWatched : 0;
  }, [animeId, episodeId]);

  const seekToStoredTime = useCallback(() => {
    if (!videoRef.current || initialSeekPerformed.current) return;

    const storedTime = getStoredTime();
    if (storedTime > 10) {
      // Seek to 10 seconds before the stored time
      videoRef.current.currentTime = Math.max(0, storedTime - 10);
      initialSeekPerformed.current = true;
    }
  }, [getStoredTime]);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(Boolean(document.fullscreenElement));
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;

    const currentSeconds = Math.floor(videoRef.current.currentTime);
    setCurrentTime(currentSeconds);

    // Check if enough time has passed since last save
    if (currentSeconds - lastSavedTimeRef.current >= SAVE_INTERVAL) {
      onUpdateProgress(currentSeconds);
      lastSavedTimeRef.current = currentSeconds;
    }
  }, [onUpdateProgress]);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      onDurationFound(videoRef.current.duration);
      // Try to seek to stored time when duration becomes available
      seekToStoredTime();
    }
  }, [seekToStoredTime]);

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

    if (sourceUrlRef.current === selectedSource.url && hlsRef.current) {
      console.log("Source already initialized, skipping...");
      return;
    }

    console.log("Initializing new source:", selectedSource.url);
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
            ></div>

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
