// components/anime-card.tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnimeCardProps {
  id: string;
  title: string;
  image: string;
  releaseDate: string;
  subOrDub: string;
}

export function AnimeCard({
  id,
  title,
  image,
  releaseDate,
  subOrDub,
}: AnimeCardProps) {
  return (
    <Link href={`/anime/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
        <div className="aspect-[3/4] relative">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
        <CardHeader className="p-4">
          {/* Fixed height and line clamp for title */}
          <CardTitle className="text-base h-12 line-clamp-2">{title}</CardTitle>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">{releaseDate}</span>
            <Badge variant={subOrDub === "dub" ? "secondary" : "default"}>
              {subOrDub.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
