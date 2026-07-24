import Link from "next/link";
import { connection } from "next/server";
import { company } from "@/lib/company";
import { getNavigationCategories, getCatalogueBrands } from "@/lib/catalog";
import { DepartmentMenu } from "@/components/layout/department-menu";
import { SearchHeader } from "@/components/layout/search-header";

export async function Header() {
  await connection();

  const [categories, brands] = await Promise.all([
    getNavigationCategories().catch(() => []),
    getCatalogueBrands().catch(() => []),
  ]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-950 text-white">
        <div className="mx-auto flex min-h-9 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-xs font-semibold sm:px-6 lg:px-8">
          <p className="hidden sm:block">Contact {company.phoneDisplay} | Countrywide delivery on confirmed orders</p>
          <p className="sm:hidden">{company.phoneDisplay}</p>
          <nav className="flex items-center gap-3" aria-label="Customer support links">
            <Link href="/track-order" className="hover:text-orange-200">Track Order</Link>
            <Link href="/contact" className="hover:text-orange-200">Contact</Link>
            <Link href="/services" className="hover:text-orange-200">Help</Link>
          </nav>
        </div>
      </div>
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${company.tradingName} home`}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-sm font-black text-white shadow-sm ring-2 ring-orange-500/20">
              CT
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-wide text-slate-950 sm:text-base">{company.tradingName}</span>
              <span className="hidden text-xs font-bold text-slate-500 sm:block">Business technology marketplace</span>
            </span>
          </Link>
          <SearchHeader categories={categories} brands={brands.slice(0, 8)} />
        </div>
      </div>
      <DepartmentMenu categories={categories} />
    </header>
  );
}
