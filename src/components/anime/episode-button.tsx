import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export interface EpisodeButtonProps {
  animeId: string;
  episodeNumber: string;
  isWatched: (animeId: string, episodeNumber: string) => boolean;
}

export default function EpisodeButton(props: EpisodeButtonProps) {
  const { animeId, episodeNumber, isWatched } = props;
  const router = useRouter();

  return (
    <Button
      variant={isWatched(animeId, episodeNumber) ? "default" : "outline"}
      className="w-full"
      onClick={() => {
        router.push(`/anime/${animeId}/${episodeNumber}`);
      }}
    >
      {episodeNumber}
    </Button>
  );
}
