import { RecentEpisodeCard } from "./recent-episode-card";
import { RecentEpisodeCardSkeleton } from "./recent-episode-card-skeleton";

interface EpisodeResult {
  id: string;
  episodeId: string;
  episodeNumber: number;
  title: string;
  image: string;
  url: string;
}

interface RecentEpisodesGridProps {
  results: EpisodeResult[];
  isLoading?: boolean;
}

export function RecentEpisodesGrid({
  results,
  isLoading,
}: RecentEpisodesGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <RecentEpisodeCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {results.map((episode) => (
        <RecentEpisodeCard key={episode.id} {...episode} />
      ))}
    </div>
  );
}
