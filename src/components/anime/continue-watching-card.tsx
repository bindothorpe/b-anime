import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";

interface ContinueWatchingCardProps {
  id: string;
  title: string;
  image: string;
  episodeNumber: number;
  progress: number;
  updatedAt: string;
  isMoreCard?: boolean;
}

export function ContinueWatchingCard({
  id,
  title,
  image,
  episodeNumber,
  progress,
  updatedAt,
  isMoreCard = false,
}: ContinueWatchingCardProps) {
  if (isMoreCard) {
    return (
      <Link href="/continue-watching">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group hover:bg-muted hover:transition-colors">
          <div className="h-full relative flex items-center justify-center">
            <div className="text-2xl">Show all</div>
            <ChevronRight className="w-8 h-8" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/anime/${id}/${episodeNumber}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] relative">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-base h-12 line-clamp-2">{title}</CardTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Episode {episodeNumber}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
              </span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
