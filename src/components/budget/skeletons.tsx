import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-8 w-28" />
        </Card>
      ))}
    </div>
  );
}

export function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-55 w-full" />
      </CardContent>
    </Card>
  );
}

export function EnvelopesCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-3 w-3/4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border/60 p-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListCardSkeleton({
  title = true,
  rows = 5,
}: {
  title?: boolean;
  rows?: number;
}) {
  return (
    <Card>
      {title && (
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
      )}
      <CardContent>
        <ul className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-14 shrink-0" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
