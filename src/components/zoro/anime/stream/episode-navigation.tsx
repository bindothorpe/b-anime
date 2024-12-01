// components/anime/stream/episode-navigation.tsx

import { Button } from "@/components/ui/button";
import { AnimeInfo } from "@/types/zoro/anime-info";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";

export function EpisodeNavigation(props: {
  animeInfo: AnimeInfo;
  episodeNumber: number;
  onNavigate: (episode: number) => void;
}) {
  const canGoToPreviousEpisode = useCallback(() => {
    return props.episodeNumber > 1;
  }, []);

  const canGoToNextEpisode = useCallback(() => {
    return props.episodeNumber < props.animeInfo.totalEpisodes;
  }, []);

  return (
    <div className="flex justify-between">
      <Button
        className="flex items-center gap-2"
        variant="outline"
        disabled={!canGoToPreviousEpisode()}
        onClick={() => props.onNavigate(props.episodeNumber - 1)}
      >
        <ChevronLeft className="w-6 h-6" />
        Previous Episode
      </Button>
      <Button
        className="flex items-center gap-2"
        variant="outline"
        disabled={!canGoToNextEpisode()}
        onClick={() => props.onNavigate(props.episodeNumber + 1)}
      >
        Next Episode
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
