import { AnimeInfo } from "@/types/zoro/anime-info";
import RecentResponse from "@/types/zoro/recent-response";
import { SearchResponse } from "@/types/zoro/search-response";
import { SourceResponse } from "@/types/zoro/source-response";
import * as React from "react";

export interface ZoroResponse<T> {
  data: T;
  error: Error | null;
  hasError: boolean;
}

export function useZoro() {
  const searchAnime = React.useCallback(
    async (
      query: string,
      page: number = 1
    ): Promise<ZoroResponse<SearchResponse>> => {
      try {
        const response = await fetch(
          `/api/zoro/anime/${encodeURIComponent(query)}?page=${page}`
        );

        const data = await response.json();

        return {
          data,
          error: null,
          hasError: false,
        };
      } catch (error) {
        return {
          data: null as any,
          error:
            error instanceof Error ? error : new Error("Failed to fetch anime"),
          hasError: true,
        };
      }
    },
    []
  );

  const getAnimeInfo = React.useCallback(
    async (id: string): Promise<ZoroResponse<AnimeInfo>> => {
      try {
        const response = await fetch(`/api/zoro/anime/info/${id}`);
        const data = await response.json();

        return {
          data,
          error: null,
          hasError: false,
        };
      } catch (error) {
        return {
          data: null as any,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to fetch anime info"),
          hasError: true,
        };
      }
    },
    []
  );

  const getRecentlyUpdated = React.useCallback(
    async (page: number = 1): Promise<ZoroResponse<RecentResponse>> => {
      try {
        const response = await fetch(`/api/zoro/anime/recent?page=${page}`);
        const data = await response.json();

        return {
          data,
          error: null,
          hasError: false,
        };
      } catch (error) {
        return {
          data: null as any,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to fetch recent updates"),
          hasError: true,
        };
      }
    },
    []
  );

  const getEpisodeSource = React.useCallback(
    async (id: string): Promise<ZoroResponse<SourceResponse>> => {
      try {
        const response = await fetch(`/api/zoro/anime/watch/${id}`);
        const data = await response.json();

        return {
          data,
          error: null,
          hasError: false,
        };
      } catch (error) {
        return {
          data: null as any,
          error:
            error instanceof Error
              ? error
              : new Error("Failed to fetch episode source"),
          hasError: true,
        };
      }
    },
    []
  );

  return {
    searchAnime,
    getAnimeInfo,
    getRecentlyUpdated,
    getEpisodeSource,
  };
}
