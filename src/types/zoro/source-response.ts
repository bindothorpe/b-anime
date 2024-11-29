export interface EpisodeSource {
  url: string;
  type: string;
  isM3U8: boolean;
}

export interface SourceResponse {
  sources: EpisodeSource[];
}
