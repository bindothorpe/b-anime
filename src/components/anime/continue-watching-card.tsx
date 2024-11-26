import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
  isMoreCard = false,
}: ContinueWatchingCardProps) {
  if (isMoreCard) {
    return (
      <Link href="/continue-watching">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="aspect-[3/4] relative bg-muted flex flex-col items-center justify-center gap-2">
            <span className="text-base md:text-lg font-medium">Show all</span>
            <ChevronRight className="w-6 h-6" />
          </div>
          {/* Empty CardHeader to maintain consistent height */}
          <CardHeader className="p-4 invisible">
            <CardTitle className="text-base h-12 line-clamp-2">
              Placeholder
            </CardTitle>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Placeholder</span>
            </div>
          </CardHeader>
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
          <CardTitle className="text-base h-12 line-clamp-2 truncate text-wrap">
            {title}
          </CardTitle>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Episode {episodeNumber}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
