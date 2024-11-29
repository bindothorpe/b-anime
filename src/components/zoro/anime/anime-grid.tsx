import { AnimeCardSkeleton } from "@/components/anime/anime-card-skeleton";
import { Result } from "@/types/zoro/search-response";
import { AnimeCard } from "./anime-card";

interface AnimeGridProps {
  results: Result[];
  isLoading?: boolean;
}

export function AnimeGrid({ results, isLoading }: AnimeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <AnimeCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {results.map((result) => (
        <AnimeCard key={result.id} {...result} />
      ))}
    </div>
  );
}
