export interface AnimeData {
    id: string; // The ID of the anime
    episodes: Array<EpisodeData>;
}

export interface EpisodeData {
    id: string; // The ID of the episode
    secondsWatched: number; // The number of seconds watched
    watched: boolean; // Whether the episode has been watched
    updatedAt: string; // The date the episode was last updated
}

export interface WatchData {
    anime: Array<AnimeData>;
}