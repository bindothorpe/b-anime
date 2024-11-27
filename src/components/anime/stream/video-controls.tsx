// VideoControls.tsx
import { useCallback, useEffect, useState } from "react";

interface VideoControlsProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isPaused: boolean;
  duration: number;
  currentTime: number;
  isFullscreen: boolean;
  animeTitle?: string;
  episodeNumber: string | number;
  onPlayPause: () => void;
}

export default function VideoControls({
  videoRef,
  containerRef,
  isPaused,
  duration,
  currentTime,
  isFullscreen,
  animeTitle,
  episodeNumber,
  onPlayPause,
}: VideoControlsProps) {
  const SEEK_TIME = 10;
  const VOLUME_STEP = 0.1;

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

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
  }, [containerRef]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  }, [videoRef]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || shouldIgnoreKeyboardControls()) return;

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
          onPlayPause();
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
      videoRef,
      shouldIgnoreKeyboardControls,
      toggleFullscreen,
      toggleMute,
      onPlayPause,
    ]
  );

  useEffect(() => {
    // Prevent default video element behaviors
    const video = videoRef.current;
    if (video) {
      const preventDefaultKeys = (e: KeyboardEvent) => {
        if (
          [
            "Space",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "KeyM",
            "KeyF",
          ].includes(e.code)
        ) {
          e.preventDefault();
        }
      };

      video.addEventListener("keydown", preventDefaultKeys, true);
      window.addEventListener("keydown", handleKeyPress);

      return () => {
        video.removeEventListener("keydown", preventDefaultKeys, true);
        window.removeEventListener("keydown", handleKeyPress);
      };
    }

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress, videoRef]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <>
      {isPaused && (
        <div className="absolute inset-0 bg-black/60 pointer-events-none hidden md:block">
          <div
            className={`absolute flex items-center rounded-lg pointer-events-auto
              ${isFullscreen ? "top-8 left-8" : "top-8 left-8"}`}
          >
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
    </>
  );
}
