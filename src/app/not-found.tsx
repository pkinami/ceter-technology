import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center px-4 py-20 text-center">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-orange-600">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black text-slate-950">
          Page not found
        </h1>
        <p className="mt-4 text-slate-600">
          The page or product you requested could not be found.
        </p>
        <ButtonLink href="/products" className="mt-6">
          Browse Products
        </ButtonLink>
      </div>
    </section>
  );
}
