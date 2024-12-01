import AnimeResponse from "./anime-response";

export default interface RecentResponse {
    currentPage: number;
    hasNextPage: boolean;
    totalPages: number;
    results: AnimeResponse[];
}