import type { Metadata } from "next";
import { Save, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "../delete-button";
import { createCategory, deleteCategory, updateCategory } from "../actions";

export const metadata: Metadata = {
  title: "Admin Categories",
  description: "Manage CETER Technology categories and subcategories.",
};

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      children: true,
      _count: { select: { products: true } },
    },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Tags className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Create category</h2>
              <p className="mt-1 text-sm text-slate-500">
                Add top-level categories or subcategories.
              </p>
            </div>
          </div>

          <form action={createCategory} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Category name
              <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Slug
              <input name="slug" placeholder="auto-generated if blank" className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Parent category
              <select name="parentId" className="rounded-md border border-slate-300 px-3 py-2">
                <option value="">Top-level category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Description
              <textarea name="description" rows={4} className="rounded-md border border-slate-300 px-3 py-2" />
            </label>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
              <Tags className="h-4 w-4" />
              Add category
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Category list</h2>
          <p className="mt-1 text-sm text-slate-500">
            Create, edit, and delete category groups for printers and office equipment.
          </p>

          <div className="mt-6 space-y-4">
            {categories.map((category) => (
              <article key={category.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{category.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {category.parent ? `Subcategory of ${category.parent.name}` : "Top-level category"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {category._count.products} product{category._count.products === 1 ? "" : "s"}
                      {category.children.length > 0
                        ? ` - ${category.children.length} subcategory${category.children.length === 1 ? "" : "ies"}`
                        : ""}
                    </p>
                  </div>
                  <form action={deleteCategory}>
                    <input type="hidden" name="categoryId" value={category.id} />
                    <DeleteButton label={category.name} />
                  </form>
                </div>

                <details className="mt-4 rounded-md bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-950">
                    Edit category
                  </summary>
                  <form action={updateCategory} className="mt-4 grid gap-4">
                    <input type="hidden" name="categoryId" value={category.id} />
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Name
                        <input name="name" required defaultValue={category.name} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                      <label className="grid gap-2 text-sm font-semibold text-slate-700">
                        Slug
                        <input name="slug" defaultValue={category.slug} className="rounded-md border border-slate-300 px-3 py-2" />
                      </label>
                    </div>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Parent category
                      <select name="parentId" defaultValue={category.parentId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                        <option value="">Top-level category</option>
                        {categories
                          .filter((item) => item.id !== category.id)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700">
                      Description
                      <textarea name="description" rows={3} defaultValue={category.description ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                    </label>
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                      <Save className="h-4 w-4" />
                      Save category
                    </button>
                  </form>
                </details>
              </article>
            ))}
            {categories.length === 0 ? (
              <p className="rounded-md bg-slate-50 p-6 text-sm text-slate-500">
                No categories yet.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
