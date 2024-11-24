import EpisodeButton, { EpisodeButtonProps } from "./episode-button";

export interface EpisodeButtonGridProps {
  episodeButtonProps: EpisodeButtonProps[];
}

export default function EpisodeButtonGrid(props: EpisodeButtonGridProps) {
  const { episodeButtonProps } = props;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
      {episodeButtonProps.map((ebp) => (
        <EpisodeButton key={ebp.animeId + "-" + ebp.episodeNumber} {...ebp} />
      ))}
    </div>
  );
}
