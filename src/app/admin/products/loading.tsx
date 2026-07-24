import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProductsLoading() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="mt-3 h-8 w-72" />
          <Skeleton className="mt-3 h-4 max-w-xl" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="mb-5 h-20" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-5">
          <Skeleton className="h-24" />
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <Skeleton className="h-12 rounded-none" />
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[64px_1fr_120px_120px_96px] gap-4 border-t border-slate-100 p-3">
                <Skeleton className="h-12 w-12" />
                <Skeleton className="h-5" />
                <Skeleton className="h-5" />
                <Skeleton className="h-5" />
                <Skeleton className="h-9" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-72" />
      </div>
    </section>
  );
}
