// src/components/anime-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-[3/4] relative">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-base line-clamp-2">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{releaseDate}</span>
            <Badge variant={subOrDub === "dub" ? "secondary" : "default"}>
              {subOrDub.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
