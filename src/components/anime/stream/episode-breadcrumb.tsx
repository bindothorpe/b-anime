// components/anime/stream/episode-breadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimeInfo } from "@/types/anime";

interface EpisodeBreadcrumbProps {
  animeInfo: AnimeInfo;
  episodeNumber: string;
  animeId: string;
}

export function EpisodeBreadcrumb({
  animeInfo,
  episodeNumber,
  animeId,
}: EpisodeBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={`/anime/${animeId}`}>
              {animeInfo.title}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Popover>
              <PopoverTrigger asChild>
                <BreadcrumbPage>Episode {episodeNumber}</BreadcrumbPage>
              </PopoverTrigger>
              <PopoverContent className="w-fit">
                <ScrollArea className="h-72 w-28 bg-background">
                  {animeInfo.episodes.map((episode) => (
                    <Link
                      key={episode.id}
                      href={`/anime/${animeId}/${episode.number}`}
                    >
                      <Button variant="link" className="w-full">
                        Episode {episode.number}
                      </Button>
                    </Link>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
