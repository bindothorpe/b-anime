import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import AnimeResponse from "@/types/zoro/anime-response";

export function AnimeCard(result: AnimeResponse) {
  return (
    <Link href={`/zoro/anime/${result.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] relative">
          <Image
            src={result.image}
            alt={result.title}
            fill
            className="object-cover"
          />
        </div>
        <CardHeader className="p-4">
          {/* Fixed height and line clamp for title */}
          <CardTitle className="text-base h-12 line-clamp-2">
            {result.title}
          </CardTitle>
          <div className="flex items-center justify-between mt-2">
            {/* <span className="text-sm text-muted-foreground">{}</span> */}
            {/* <Badge variant={subOrDub === "dub" ? "secondary" : "default"}>
              {subOrDub.toUpperCase()}
            </Badge> */}
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
