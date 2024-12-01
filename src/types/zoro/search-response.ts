import AnimeResponse from "./anime-response";

export interface SearchResponse {
  currentPage: Number | null;
  hasNextPage: boolean;
  totalPages: Number | null;
  results: AnimeResponse[];
}
