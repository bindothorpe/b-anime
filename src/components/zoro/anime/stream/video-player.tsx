// VideoPlayer.tsx
"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import Hls, { Events, ErrorTypes } from "hls.js";
import { HlsError } from "@/types/anime";
import * as ls from "local-storage";
import VideoControls from "@/components/anime/stream/video-controls";
import { SourceResponse } from "@/types/zoro/source-response";

interface VideoPlayerProps {
  sourceResponse: SourceResponse;
  onError: (error: string) => void;
  animeTitle: string | undefined;
  episodeNumber: string | number;
  onUpdateProgress: (seconds: number) => void;
  onDurationFound: (duration: number) => void;
  animeId: string;
  episodeId: string;
  subtitleUrl: string | undefined;
}

export function VideoPlayer({
  sourceResponse,
  onError,
  animeTitle,
  episodeNumber,
  onUpdateProgress,
  onDurationFound,
  animeId,
  episodeId,
  subtitleUrl,
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
  const [subtitleContent, setSubtitleContent] = useState<string | null>(null);

  const SAVE_INTERVAL = 10; // Minimum seconds between saves
  const STORAGE_KEY = "anime_watch_data";

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

    if (currentSeconds - lastSavedTimeRef.current >= SAVE_INTERVAL) {
      onUpdateProgress(currentSeconds);
      lastSavedTimeRef.current = currentSeconds;
    }
  }, [onUpdateProgress]);

  const fetchSubtitles = useCallback(
    async (url: string) => {
      try {
        // Option 1: Fetch through your backend proxy
        const response = await fetch(
          `/api/zoro/subtitles?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) throw new Error("Failed to fetch subtitles");
        const vttContent = await response.text();
        return vttContent;
      } catch (error) {
        console.error("Error fetching subtitles:", error);
        onError("Failed to load subtitles");
        return null;
      }
    },
    [onError]
  );

  useEffect(() => {
    console.log("Starting to add subtitles");
    const video = videoRef.current;
    if (!video || !subtitleUrl) return;

    // Remove existing tracks
    while (video.firstChild) {
      console.log("Removing previous track");
      video.removeChild(video.firstChild);
    }

    const loadSubtitles = async () => {
      if (video.firstChild) {
        console.log("Already had track");
        return;
      }
      const vttContent = await fetchSubtitles(subtitleUrl);
      if (!vttContent) return;

      // Create a blob URL for the subtitle content
      const blob = new Blob([vttContent], { type: "text/vtt" });
      const blobUrl = URL.createObjectURL(blob);

      const track = document.createElement("track");
      track.kind = "subtitles";
      track.label = "English";
      track.srclang = "en";
      track.src = blobUrl;
      track.default = true;

      console.log("Adding subtitles");
      video.appendChild(track);

      // Enable/disable based on state
      const textTracks = video.textTracks[0];
      if (textTracks) {
        textTracks.mode = "showing";
      }

      // Store the blob URL to clean it up later
      setSubtitleContent(blobUrl);
    };

    loadSubtitles();

    return () => {
      // Cleanup
      while (video.firstChild) {
        video.removeChild(video.firstChild);
      }
      if (subtitleContent) {
        URL.revokeObjectURL(subtitleContent);
      }
    };
  }, [subtitleUrl, fetchSubtitles]);

  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      onDurationFound(videoRef.current.duration);
      seekToStoredTime();
    }
  }, [onDurationFound, seekToStoredTime]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      setIsPaused(videoRef.current.paused);
    }
  }, []);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
      sourceUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [handleFullscreenChange]);

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
    if (!sourceResponse?.sources?.[0] || !videoRef.current) return;

    const selectedSource = sourceResponse.sources[0];

    if (!selectedSource) {
      onError("No valid video source found");
      return;
    }

    if (sourceUrlRef.current === selectedSource.url && hlsRef.current) {
      console.log("Source already initialized, skipping...");
      return;
    }

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
  }, [sourceResponse, cleanupHls, onError]);

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
        onKeyDown={(e) => {
          // Prevent default keyboard behavior
          if (
            [
              "Space",
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "KeyF",
              "KeyM",
            ].includes(e.code)
          ) {
            e.preventDefault();
          }
        }}
      />

      <VideoControls
        videoRef={videoRef}
        containerRef={containerRef}
        isPaused={isPaused}
        duration={duration}
        currentTime={currentTime}
        isFullscreen={isFullscreen}
        animeTitle={animeTitle}
        episodeNumber={episodeNumber}
        onPlayPause={handlePlayPause}
      />
    </div>
  );
}
