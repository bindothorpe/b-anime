import { Button } from "@/components/ui/button";
import { Episode } from "@/types/zoro/anime-info";
import { useRouter } from "next/navigation";

export default function EpisodeButton(props: {
  animeId: string;
  episode: Episode;
  isWatched: (animeId: string, episodeNumber: string) => boolean;
}) {
  const router = useRouter();

  return (
    <Button
      variant={
        props.isWatched(props.animeId, props.episode.number.toString())
          ? "default"
          : "outline"
      }
      className="w-full"
      onClick={() => {
        router.push(
          `/zoro/anime/${props.animeId}/${props.episode.number.toString()}`
        );
      }}
    >
      {props.episode.number.toString()}
    </Button>
  );
}
