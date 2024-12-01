import AnimeResponse from "./anime-response";

// Search response
// This is the response you get when you fetch(`/api/zoro/search?q=${query}&page=${page}`)
export interface SearchResponse {
  currentPage: number | null;
  hasNextPage: boolean;
  totalPages: number | null;
  results: AnimeResponse[];
}
