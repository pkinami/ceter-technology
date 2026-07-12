import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="bg-slate-50">
      <section className="bg-slate-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <Skeleton className="h-4 w-48 bg-white/20" />
            <Skeleton className="mt-4 h-11 max-w-xl bg-white/20" />
            <Skeleton className="mt-4 h-5 max-w-lg bg-white/15" />
          </div>
          <Skeleton className="h-20 bg-white/15" />
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <Skeleton className="h-6 w-40" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-11" />
            ))}
          </div>
        </aside>
        <div>
          <Skeleton className="mb-5 h-16" />
          <ProductGridSkeleton count={6} />
        </div>
      </section>
    </div>
  );
}
