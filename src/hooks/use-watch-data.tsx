import * as React from "react";
import * as ls from "local-storage";
import { WatchData } from "../types/watch-data";

const STORAGE_KEY = "anime_watch_data";

export function useWatchData() {
  const [watchData, setWatchData] = React.useState<WatchData>(() => {
    const stored = ls.get<WatchData>(STORAGE_KEY);
    return stored || { anime: [] };
  });

  // Helper function to save data to localStorage
  const saveData = React.useCallback((newData: WatchData) => {
    ls.set(STORAGE_KEY, newData);
    setWatchData(newData);
  }, []);

  // Helper function to find anime and episode
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

  const markWatched = React.useCallback(
    (animeId: string, episodeId: string) => {
      const indexes = findAnimeAndEpisode(animeId, episodeId);
      const newData = { ...watchData };

      if (!indexes) {
        // If anime doesn't exist, create it with the episode
        newData.anime.push({
          id: animeId,
          episodes: [
            {
              id: episodeId,
              secondsWatched: 0,
              watched: true,
            },
          ],
        });
      } else {
        const { animeIndex, episodeIndex } = indexes;

        if (episodeIndex === -1) {
          // Anime exists but episode doesn't - add the episode
          newData.anime[animeIndex].episodes.push({
            id: episodeId,
            secondsWatched: 0,
            watched: true,
          });
        } else {
          // Both exist - update watched status
          newData.anime[animeIndex].episodes[episodeIndex].watched = true;
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
        // If anime doesn't exist, create it with the episode
        newData.anime.push({
          id: animeId,
          episodes: [
            {
              id: episodeId,
              secondsWatched: seconds,
              watched: false,
            },
          ],
        });
      } else {
        const { animeIndex, episodeIndex } = indexes;

        if (episodeIndex === -1) {
          // Anime exists but episode doesn't - add the episode
          newData.anime[animeIndex].episodes.push({
            id: episodeId,
            secondsWatched: seconds,
            watched: false,
          });
        } else {
          // Both exist - update seconds if greater than current
          const currentSeconds =
            newData.anime[animeIndex].episodes[episodeIndex].secondsWatched;
          if (seconds > currentSeconds) {
            newData.anime[animeIndex].episodes[episodeIndex].secondsWatched =
              seconds;
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
      return watchData.anime[animeIndex].episodes[episodeIndex].watched;
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

  return {
    watchData,
    markWatched,
    updateSecondsWatched,
    isWatched,
    getSecondsWatched,
  };
}
