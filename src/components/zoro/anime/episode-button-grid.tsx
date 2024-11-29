import { Episode } from "@/types/zoro/anime-info";
import EpisodeButton from "./episode-button";

export default function EpisodeButtonGrid(props: {
  animeId: string;
  episodes: Episode[];
  isWatched: (animeId: string, episodeNumber: string) => boolean;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 overflow-y-auto max-h-96">
      {props.episodes.map((episode: Episode) => (
        <EpisodeButton
          key={props.animeId + "-" + episode.number.toString()}
          animeId={props.animeId}
          episode={episode}
          isWatched={props.isWatched}
        />
      ))}
    </div>
  );
}
