// types/anime.ts
import { ErrorTypes, ErrorDetails } from "hls.js";

export interface HlsError {
  type: ErrorTypes;
  fatal: boolean;
  details: ErrorDetails;
}

export interface SubtitleTrack {
  lang: string;
  label: string;
  default?: boolean;
  src: string;
}

export interface EpisodeSource {
  headers: { [key: string]: string };
  sources: Array<{
    url: string;
    quality: string;
    isM3U8: boolean;
  }>;
  download: string;
  subtitles?: SubtitleTrack[];
}

export interface AnimeInfo {
  id: string;
  title: string;
  url: string;
  image: string;
  releaseDate: string;
  description: string;
  genres: string[];
  subOrDub: string;
  type: string;
  status: string;
  otherName: string;
  totalEpisodes: number;
  episodes: Array<{
    id: string;
    number: number;
    url: string;
  }>;
}