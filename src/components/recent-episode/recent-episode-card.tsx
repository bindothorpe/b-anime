// components/recent-episode-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface RecentEpisodeCardProps {
  id: string;
  title: string;
  episodeNumber: number;
  image: string;
}

export function RecentEpisodeCard({
  id,
  title,
  episodeNumber,
  image,
}: RecentEpisodeCardProps) {
  return (
    <Link href={`/anime/${id}/${episodeNumber}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] relative">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
        <CardHeader className="p-4">
          {/* Fixed height and line clamp for title */}
          <CardTitle className="text-base h-12 line-clamp-2">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">
            Episode {episodeNumber}
          </span>
        </CardHeader>
      </Card>
    </Link>
  );
}
