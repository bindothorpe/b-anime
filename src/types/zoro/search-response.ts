export interface SearchResponse {
  currentPage: Number | null;
  hasNextPage: boolean;
  totalPages: Number | null;
  results: Result[];
}
export interface Result {
  id: string;
  title: string;
  url: string;
  image: string;
  duration: string;
  japaneseTitle: string;
  type: string;
  nsfw: boolean;
  sub: number;
  dub: number;
  episodes: number;
}