import { useEffect, useState } from "react";
import { WatchData } from "@/types/watch-data";
import * as ls from "../../../lib/storage";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ContinueWatchingCard } from "./continue-watching-card";
import { useWatchData } from "@/hooks/use-watch-data";
import ContinueWatchingResult from "@/types/continue-watching-result";
import ContinueWatchingCardSkeleton from "./continue-watching-card-skeleton";

const STORAGE_KEY = "anime_watch_data";
const MAX_ITEMS = 9;

/** Resolve anime details by id: info route first (hianime slug), then search
 *  by base name for legacy gogoanime-era slugs. */
async function resolveDetails(
  animeId: string,
): Promise<{ title: string; image: string } | null> {
  try {
    const infoResponse = await fetch(`/api/anime/info/${animeId}`);
    if (infoResponse.ok) {
      const info = await infoResponse.json();
      if (info?.title) return { title: info.title, image: info.image ?? "" };
    }

    const baseId = animeId.replace(/-\d+$/, "");
    const searchResponse = await fetch(`/api/anime/${baseId}`);
    if (searchResponse.ok) {
      const searchJson = await searchResponse.json();
      const result =
        searchJson.results?.find((r: { id: string }) => r.id === animeId) ??
        searchJson.results?.[0];
      if (result?.title)
        return { title: result.title, image: result.image ?? "" };
    }
    return null;
  } catch {
    return null;
  }
}

export function ContinueWatchingSection() {
  const [results, setResults] = useState<ContinueWatchingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const { deleteAnime } = useWatchData();

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
            try {
              const animeDetails = await resolveDetails(anime.id);
              if (!animeDetails) return null;

              return {
                animeId: anime.id,
                episodeId: latestEpisode.id,
                episodeNumber: parseInt(
                  latestEpisode.id.split("-").pop() || "1",
                ),
                title: animeDetails.title,
                image: animeDetails.image,
                progress,
                updatedAt: latestEpisode.updatedAt,
              };
            } catch (error) {
              console.error("Error fetching anime details:", error);
              return null;
            }
          }),
        );

        // Filter out null values and sort by updatedAt
        const validResults = continueWatchingItems
          .filter((item): item is ContinueWatchingResult => item !== null)
          .sort((a, b) => {
            const dateA = new Date(a.updatedAt);
            const dateB = new Date(b.updatedAt);
            return dateB.getTime() - dateA.getTime();
          })
          .slice(0, MAX_ITEMS);

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
      <>
        <h1 className="text-xl md:text-2xl font-bold mb-2 pl-4">
          Continue where you left off!
        </h1>
        <div className="mb-8 md:mb-12">
          <ScrollArea className="w-full whitespace-nowrap rounded-md">
            <div className="flex gap-4 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-[294px] md:w-[232px] lg:w-[234px] xl:w-[234px] max-xl:[284px] flex-shrink-0"
                >
                  <ContinueWatchingCardSkeleton />
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <>
      <h1 className="text-xl md:text-2xl font-bold mb-2 pl-4">
        Continue where you left off!
      </h1>
      <div className="mb-8 md:mb-12">
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex gap-4 p-4">
            {results.map((item) => (
              <div
                key={item.animeId}
                className="w-[294px] md:w-[232px] lg:w-[234px] xl:w-[234px] max-xl:[284px] flex-shrink-0"
              >
                <ContinueWatchingCard
                  id={item.animeId}
                  {...item}
                  onDelete={() => {
                    deleteAnime(item.animeId);
                    setRefresh((prev) => prev + 1);
                  }}
                />
              </div>
            ))}
            {results.length === MAX_ITEMS && (
              <div className="w-[294px] md:w-[232px] lg:w-[234px] xl:w-[234px] max-xl:[284px] flex-shrink-0">
                <ContinueWatchingCard
                  id=""
                  title=""
                  image=""
                  episodeNumber={0}
                  progress={0}
                  updatedAt=""
                  isMoreCard
                />
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
}
