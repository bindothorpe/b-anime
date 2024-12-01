import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ContinueWatchingCardProps {
  id: string;
  title: string;
  image: string;
  episodeNumber: number;
  progress: number;
  updatedAt: string;
  isMoreCard?: boolean;
  onDelete?: (id: string) => void;
}

export function ContinueWatchingCard({
  id,
  title,
  image,
  episodeNumber,
  progress,
  isMoreCard = false,
  onDelete,
}: ContinueWatchingCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  if (isMoreCard) {
    return (
      <Link href="/continue-watching">
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
          <div className="h-full relative hover:bg-muted flex items-center justify-center gap-2 transition-colors">
            <span className="text-base md:text-lg font-medium">Show all</span>
            <ChevronRight className="w-6 h-6" />
          </div>
        </Card>
      </Link>
    );
  }

  return (
    <>
      <div className="group relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-40 opacity-100 group-hover:opacity-100 hover:bg-destructive/90 hover:text-destructive-foreground transition-all bg-background/75"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowDialog(true);
          }}
        >
          <Trash className="h-4 w-4" />
        </Button>
        <Link href={`/zoro/anime/${id}/${episodeNumber}`}>
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
      </div>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from recently watched</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {title} from your recently
              watched? This will remove all watch data for this anime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(id);
                setShowDialog(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
