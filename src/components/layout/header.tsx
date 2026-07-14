import Link from "next/link";
import { company } from "@/lib/company";
import { DepartmentMenu } from "@/components/layout/department-menu";
import { SearchHeader } from "@/components/layout/search-header";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:gap-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${company.tradingName} home`}>
            <span className="grid h-11 w-11 place-items-center rounded-md bg-slate-950 text-sm font-black text-white shadow-sm">
              CT
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-black tracking-wide text-slate-950 sm:text-base">{company.tradingName}</span>
              <span className="hidden text-xs font-bold text-slate-500 sm:block">Enterprise technology marketplace</span>
            </span>
          </Link>
          <SearchHeader />
        </div>
      </div>
      <DepartmentMenu />
    </header>
  );
}
