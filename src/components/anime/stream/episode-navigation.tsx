// components/anime/stream/episode-navigation.tsx
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { canGoToNextEpisode, canGoToPreviousEpisode } from "@/utils/episode";

interface EpisodeNavigationProps {
  episodeNumber: number;
  totalEpisodes: number;
  onNavigate: (episode: number) => void;
}

export function EpisodeNavigation({
  episodeNumber,
  totalEpisodes,
  onNavigate,
}: EpisodeNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button
        className="flex items-center gap-2"
        variant="outline"
        disabled={!canGoToPreviousEpisode(episodeNumber)}
        onClick={() => onNavigate(episodeNumber - 1)}
      >
        <ChevronLeft className="w-6 h-6" />
        Previous Episode
      </Button>
      <Button
        className="flex items-center gap-2"
        variant="outline"
        disabled={!canGoToNextEpisode(episodeNumber, totalEpisodes)}
        onClick={() => onNavigate(episodeNumber + 1)}
      >
        Next Episode
        <ChevronRight className="w-6 h-6" />
      </Button>
    </div>
  );
}
