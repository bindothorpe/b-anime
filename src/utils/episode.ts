// utils/episode.ts
export const canGoToNextEpisode = (currentEpisode: number, totalEpisodes: number) => {
    return currentEpisode < totalEpisodes;
  };
  
  export const canGoToPreviousEpisode = (currentEpisode: number) => {
    return currentEpisode > 1;
  };
  
  export const formatEpisodeId = (animeId: string, episodeNumber: string) => {
    return decodeURIComponent(animeId)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") +
      "-episode-" +
      episodeNumber;
  };