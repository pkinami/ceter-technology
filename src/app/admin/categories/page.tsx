import type { Metadata } from "next";
import { GripVertical, Save, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "../delete-button";
import { createCategory, deleteCategory, updateCategory } from "../actions";

export const metadata: Metadata = {
  title: "Category Manager",
  description: "Manage CETER Technology category hierarchy, SEO, and ordering.",
};

type CategoryRow = Awaited<ReturnType<typeof getCategories>>[number];

function getCategories() {
  return prisma.category.findMany({
    include: {
      parent: true,
      children: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
      _count: { select: { products: true } },
    },
    orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

function depthFor(category: CategoryRow, categories: CategoryRow[]) {
  let depth = 0;
  let parentId = category.parentId;
  while (parentId) {
    const parent = categories.find((item) => item.id === parentId);
    if (!parent) break;
    depth += 1;
    parentId = parent.parentId;
  }
  return depth;
}

export default async function AdminCategoriesPage() {
  const categories = await getCategories();
  const topLevel = categories.filter((category) => !category.parentId);

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Catalogue structure</p>
        <h1 className="text-2xl font-black text-slate-950">Category manager</h1>
        <p className="mt-1 text-sm text-slate-500">Parent categories, subcategories, ordering, descriptions, and SEO fields for a catalogue that can scale beyond 500 products.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Tags className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-black text-slate-950">Create category</h2>
          </div>
          <CategoryForm categories={categories} action={createCategory} submitLabel="Add category" />
        </aside>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Category tree</h2>
            <div className="mt-5 space-y-3">
              {topLevel.map((category) => (
                <CategoryBranch key={category.id} category={category} categories={categories} />
              ))}
              {topLevel.length === 0 ? <p className="rounded-md bg-slate-50 p-5 text-sm text-slate-500">No categories yet.</p> : null}
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Sortable category list</h2>
            <p className="mt-1 text-sm text-slate-500">Use the sort order field to control department and submenu ordering. Drag handles are visual anchors for staff workflow; persistence is handled by the numeric order field.</p>
            <div className="mt-5 space-y-4">
              {categories.map((category) => (
                <article key={category.id} className="rounded-md border border-slate-200 p-4" style={{ marginLeft: `${Math.min(depthFor(category, categories) * 20, 60)}px` }}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-3">
                      <GripVertical className="mt-1 h-5 w-5 text-slate-400" />
                      <div>
                        <h3 className="font-black text-slate-950">{category.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {category.parent ? `Under ${category.parent.name}` : "Top-level department"} - {category._count.products} product{category._count.products === 1 ? "" : "s"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{category.description || "No description yet."}</p>
                      </div>
                    </div>
                    <form action={deleteCategory}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <DeleteButton label={category.name} />
                    </form>
                  </div>

                  <details className="mt-4 rounded-md bg-slate-50 p-4">
                    <summary className="cursor-pointer text-sm font-black text-slate-950">Edit category</summary>
                    <CategoryForm categories={categories.filter((item) => item.id !== category.id)} category={category} action={updateCategory} submitLabel="Save category" />
                  </details>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function CategoryBranch({ category, categories }: { category: CategoryRow; categories: CategoryRow[] }) {
  const children = categories.filter((item) => item.parentId === category.id);

  return (
    <div className="rounded-md border border-slate-200 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black text-slate-950">{category.name}</p>
          <p className="text-xs text-slate-500">Order {category.sortOrder} - {category._count.products} products</p>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{children.length} child categories</span>
      </div>
      {children.length > 0 ? (
        <div className="mt-3 space-y-2 border-l border-slate-200 pl-4">
          {children.map((child) => <CategoryBranch key={child.id} category={child} categories={categories} />)}
        </div>
      ) : null}
    </div>
  );
}

function CategoryForm({
  categories,
  category,
  action,
  submitLabel,
}: {
  categories: Array<{ id: string; name: string; parent: { name: string } | null }>;
  category?: CategoryRow;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-5 grid gap-4">
      {category ? <input type="hidden" name="categoryId" value={category.id} /> : null}
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Category name
        <input name="name" required defaultValue={category?.name} className="h-10 rounded-md border border-slate-300 px-3" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Slug
        <input name="slug" defaultValue={category?.slug} placeholder="auto-generated if blank" className="h-10 rounded-md border border-slate-300 px-3" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Parent category
        <select name="parentId" defaultValue={category?.parentId ?? ""} className="h-10 rounded-md border border-slate-300 px-3">
          <option value="">Top-level category</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>{item.parent ? `${item.parent.name} / ` : ""}{item.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Sort order
        <input name="sortOrder" type="number" step="1" defaultValue={category?.sortOrder ?? 0} className="h-10 rounded-md border border-slate-300 px-3" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Description
        <textarea name="description" rows={4} defaultValue={category?.description ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        SEO title
        <input name="seoTitle" defaultValue={category?.seoTitle ?? ""} className="h-10 rounded-md border border-slate-300 px-3" />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        SEO description
        <textarea name="seoDescription" rows={3} defaultValue={category?.seoDescription ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
        <Save className="h-4 w-4" /> {submitLabel}
      </button>
    </form>
  );
}
