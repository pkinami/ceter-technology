import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailsLoading() {
  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div>
          <Skeleton className="aspect-square w-full" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-5 w-72" />
          <Skeleton className="mt-5 h-12 max-w-xl" />
          <Skeleton className="mt-4 h-5 w-40" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-10/12" />
            <Skeleton className="h-5 w-8/12" />
          </div>
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-36" />
            <Skeleton className="h-11 w-44" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16" />
            ))}
          </div>
          <Skeleton className="mt-10 h-48" />
        </div>
      </section>
      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48" />
          <div className="mt-6">
            <ProductGridSkeleton count={4} />
          </div>
        </div>
      </section>
    </div>
  );
}
