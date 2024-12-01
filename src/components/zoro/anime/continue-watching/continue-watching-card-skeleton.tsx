import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContinueWatchingCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
      <div className="aspect-[3/4] relative">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader className="p-2 md:p-4 space-y-2">
        <Skeleton className="h-8 md:h-4 w-2/3" />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 md:h-3 w-16 md:w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
        </div>
      </CardHeader>
    </Card>
  );
}
