"use client";
import { useWatchData } from "@/hooks/use-watch-data";
import ContinueWatchingResult from "@/types/continue-watching-result";
import { useEffect, useState } from "react";
import { WatchData } from "@/types/watch-data";
import * as ls from "local-storage";
import Link from "next/link";
import AnimeResponse from "@/types/zoro/anime-response";
import { ContinueWatchingCard } from "./continue-watching-card";
import ContinueWatchingCardSkeleton from "./continue-watching-card-skeleton";
import AnimeResult from "@/types/anime-result";
import { useZoro } from "@/hooks/use-zoro";

const STORAGE_KEY = "anime_watch_data";

export default function ContinueWatchingGrid() {
  const [results, setResults] = useState<ContinueWatchingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const { deleteAnime } = useWatchData();
  const { getAnimeInfo } = useZoro();

  useEffect(() => {
    const fetchContinueWatching = async () => {
      setIsLoading(true);
      try {
        // Get watch data from localStorage
        const watchData = ls.get<WatchData>(STORAGE_KEY) || { anime: [] };

        // Process each anime to get the latest episode
        const continueWatchingItems = await Promise.all(
          watchData.anime.map(async (anime) => {
            // Sort episodes by updatedAt to get the latest
            const latestEpisode = [...anime.episodes].sort((a, b) => {
              const dateA = new Date(a.updatedAt);
              const dateB = new Date(b.updatedAt);
              return dateB.getTime() - dateA.getTime();
            })[0];

            if (!latestEpisode) return null;

            // Calculate progress percentage
            const progress =
              (latestEpisode.secondsWatched / latestEpisode.duration) * 100; // Assuming average episode length is 24 minutes

            // Only include if progress is between 10% and 90%
            if (latestEpisode.secondsWatched <= 5) return null;

            if (latestEpisode.secondsWatched >= latestEpisode.duration - 5)
              return null;

            // Fetch anime details
            const response = await getAnimeInfo(anime.id);

            if (response.hasError) {
              console.error(response.error);
              return null;
            }

            const animeInfo = response.data;

            return {
              animeId: anime.id,
              episodeId: latestEpisode.id,
              episodeNumber: parseInt(latestEpisode.id.split("-").pop() || "1"),
              title: animeInfo.title,
              image: animeInfo.image,
              progress,
              updatedAt: latestEpisode.updatedAt,
            };
          })
        );

        // Filter out null values and sort by updatedAt
        const validResults = continueWatchingItems
          .filter((item): item is ContinueWatchingResult => item !== null)
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            return dateB.getTime() - dateA.getTime();
          });

        setResults(validResults);
      } catch (error) {
        console.error("Error processing continue watching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContinueWatching();
  }, [refresh]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 20 }).map((_, index) => (
          <ContinueWatchingCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {results.map((anime) => (
          <ContinueWatchingCard
            key={anime.animeId}
            id={anime.animeId}
            {...anime}
            onDelete={() => {
              deleteAnime(anime.animeId);
              setRefresh((prev) => prev + 1);
            }}
          />
        ))}
      </div>
    );
  } else {
    return (
      <>
        <div className="text-center">No anime to continue watching.</div>
        <div className="text-center">
          <span>Start exploring anime on the </span>
          <Link href="/">
            <span className="hover:underline">home</span>
          </Link>
          <span> page.</span>
        </div>
      </>
    );
  }
}
