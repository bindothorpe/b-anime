"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchData } from "@/hooks/use-watch-data";
import { AnimeInfo } from "@/types/zoro/anime-info";
import EpisodeButtonGrid from "@/components/zoro/anime/episode-button-grid";
import { useZoro, ZoroResponse } from "@/hooks/use-zoro";

export default function AnimePage() {
  const params = useParams();
  const id = params.id as string;

  const [animeInfo, setAnimeInfo] = useState<AnimeInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isWatched } = useWatchData();
  const { getAnimeInfo } = useZoro();

  useEffect(() => {
    const fetchAnimeInfo = async () => {
      const response = await getAnimeInfo(id);

      if (response.hasError) {
        console.error(response.error);
      } else {
        setAnimeInfo(response.data);
      }

      setIsLoading(false);
    };

    fetchAnimeInfo();
  }, [id]);

  if (isLoading) {
    return <AnimeInfoSkeleton />;
  }

  if (!animeInfo) {
    return <div>Failed to load anime information.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>{animeInfo.title}</CardTitle>
          {animeInfo.japaneseTitle && (
            <p className="text-sm text-muted-foreground">
              {animeInfo.japaneseTitle}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            {/* Image Section */}
            <div className="relative aspect-[3/4] w-full">
              <Image
                src={animeInfo.image}
                alt={animeInfo.title}
                fill
                className="object-cover rounded-lg"
              />
            </div>

            {/* Info Section */}
            <div className="space-y-4">
              {/* Status and Type */}
              <div className="flex gap-2 flex-wrap">
                {/* <Badge>{animeInfo.status}</Badge> */}
                <Badge variant="secondary">{animeInfo.type}</Badge>
                <Badge variant="outline">
                  {animeInfo.subOrDub === "both"
                    ? "Sub & Dub"
                    : animeInfo.subOrDub}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-muted-foreground">{animeInfo.description}</p>

              {/* Genres
              <div>
                <h3 className="font-semibold mb-2">Genres</h3>
                <div className="flex gap-2 flex-wrap">
                  {animeInfo.genres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div> */}

              {/* Episodes */}
              <div>
                <h3 className="font-semibold mb-2">Episodes</h3>
                <EpisodeButtonGrid
                  animeId={animeInfo.id}
                  episodes={animeInfo.episodes}
                  isWatched={isWatched}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnimeInfoSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
