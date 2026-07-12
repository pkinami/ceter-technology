import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("admin-skeleton rounded-md bg-slate-200", className)}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-4 p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-11/12" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="rounded-md bg-slate-50 p-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
        </div>
        <Skeleton className="h-7 w-36" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
