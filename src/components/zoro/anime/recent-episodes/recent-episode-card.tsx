import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import AnimeResponse from "@/types/zoro/anime-response";

export function RecentEpisodeCard(props: AnimeResponse) {
  return (
    <Link href={`/zoro/anime/${props.id}/${props.sub}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] relative">
          <Image
            src={props.image}
            alt={props.title}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader className="p-4">
          {/* Fixed height and line clamp for title */}
          <CardTitle className="text-base h-12 line-clamp-2">
            {props.title}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Episode {props.sub}
          </span>
        </CardHeader>
      </Card>
    </Link>
  );
}
