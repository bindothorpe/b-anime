import * as React from "react";
import * as ls from "local-storage";
import { WatchData } from "../types/watch-data";

const STORAGE_KEY = "anime_watch_data";
const WATCHED_THRESHOLD = 0;

export function useWatchData() {
  const [watchData, setWatchData] = React.useState<WatchData>(() => {
    const stored = ls.get<WatchData>(STORAGE_KEY);
    return stored || { anime: [] };
  });

  const saveData = React.useCallback((newData: WatchData) => {
    ls.set(STORAGE_KEY, newData);
    setWatchData(newData);
  }, []);

  const deleteAnime = React.useCallback(
    (animeId: string) => {
      const newData = {
        ...watchData,
        anime: watchData.anime.filter((anime) => anime.id !== animeId),
      };
      saveData(newData);
    },
    [watchData, saveData]
  );

  // Rest of the hook implementation remains the same
  const findAnimeAndEpisode = React.useCallback(
    (animeId: string, episodeId: string) => {
      const animeIndex = watchData.anime.findIndex((a) => a.id === animeId);
      if (animeIndex === -1) return null;

      const episodeIndex = watchData.anime[animeIndex].episodes.findIndex(
        (e) => e.id === episodeId
      );
      if (episodeIndex === -1) return { animeIndex, episodeIndex: -1 };

      return { animeIndex, episodeIndex };
    },
    [watchData]
  );

  const updateDuration = React.useCallback(
    (animeId: string, episodeId: string, duration: number) => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      const newData = { ...watchData };

      if (!indexes) {
        newData.anime.push({
          id: animeId,
          episodes: [
            {
              id: episodeId,
              secondsWatched: 0,
              duration: duration,
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      } else {
        const { animeIndex, episodeIndex } = indexes;

        if (episodeIndex === -1) {
          newData.anime[animeIndex].episodes.push({
            id: episodeId,
            secondsWatched: 0,
            duration: duration,
            updatedAt: new Date().toISOString(),
          });
        } else {
          newData.anime[animeIndex].episodes[episodeIndex].duration = duration;
          newData.anime[animeIndex].episodes[episodeIndex].updatedAt =
            new Date().toISOString();
        }
      }

      saveData(newData);
    },
    [watchData, findAnimeAndEpisode, saveData]
  );

  const updateSecondsWatched = React.useCallback(
    (animeId: string, episodeId: string, seconds: number) => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      const newData = { ...watchData };

      if (!indexes) {
        newData.anime.push({
          id: animeId,
          episodes: [
            {
              id: episodeId,
              secondsWatched: seconds,
              duration: 0,
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      } else {
        const { animeIndex, episodeIndex } = indexes;

        if (episodeIndex === -1) {
          newData.anime[animeIndex].episodes.push({
            id: episodeId,
            secondsWatched: seconds,
            duration: 0,
            updatedAt: new Date().toISOString(),
          });
        } else {
          const currentSeconds =
            newData.anime[animeIndex].episodes[episodeIndex].secondsWatched;
          if (seconds > currentSeconds) {
            newData.anime[animeIndex].episodes[episodeIndex].secondsWatched =
              seconds;
            newData.anime[animeIndex].episodes[episodeIndex].updatedAt =
              new Date().toISOString();
          }
        }
      }

      saveData(newData);
    },
    [watchData, findAnimeAndEpisode, saveData]
  );

  const isWatched = React.useCallback(
    (animeId: string, episodeId: string): boolean => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      if (!indexes || indexes.episodeIndex === -1) return false;

      const { animeIndex, episodeIndex } = indexes;
      return (
        watchData.anime[animeIndex].episodes[episodeIndex].secondsWatched >
        WATCHED_THRESHOLD
      );
    },
    [watchData, findAnimeAndEpisode]
  );

  const getSecondsWatched = React.useCallback(
    (animeId: string, episodeId: string): number => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      if (!indexes || indexes.episodeIndex === -1) return 0;

      const { animeIndex, episodeIndex } = indexes;
      return watchData.anime[animeIndex].episodes[episodeIndex].secondsWatched;
    },
    [watchData, findAnimeAndEpisode]
  );

  const getDuration = React.useCallback(
    (animeId: string, episodeId: string): number => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      if (!indexes || indexes.episodeIndex === -1) return 0;

      const { animeIndex, episodeIndex } = indexes;
      return watchData.anime[animeIndex].episodes[episodeIndex].duration || 0;
    },
    [watchData, findAnimeAndEpisode]
  );

  const getLastUpdated = React.useCallback(
    (animeId: string, episodeId: string): string | null => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      if (!indexes || indexes.episodeIndex === -1) return null;

      const { animeIndex, episodeIndex } = indexes;
      return watchData.anime[animeIndex].episodes[episodeIndex].updatedAt;
    },
    [watchData, findAnimeAndEpisode]
  );

  return {
    watchData,
    updateSecondsWatched,
    updateDuration,
    getDuration,
    isWatched,
    getSecondsWatched,
    getLastUpdated,
    deleteAnime,
  };
}
