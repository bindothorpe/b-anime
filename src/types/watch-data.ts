export interface AnimeData {
    id: string; // The ID of the anime
    episodes: Array<EpisodeData>;
}

export interface EpisodeData {
    id: string; // The ID of the episode
    secondsWatched: number; // The number of seconds watched
    watched: boolean; // Whether the episode has been watched
}

export interface WatchData {
    anime: Array<AnimeData>;
}