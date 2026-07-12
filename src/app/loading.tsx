import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-10 w-64" />
      <ProductGridSkeleton count={6} />
    </div>
  );
}
