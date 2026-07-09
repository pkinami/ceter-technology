import type { Metadata } from "next";
import {
  Boxes,
  ClipboardList,
  ImageUp,
  PackagePlus,
  Tags,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createCategory,
  createProduct,
  updateOrderStatus,
  updateProductManagement,
} from "./actions";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Protected admin dashboard for CETER Technology.",
};

const orderStatuses = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

function money(value: { toString(): string }) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(Number(value.toString()));
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [categories, products, orders] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-orange-300">
              Admin only
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-normal">
              CETER operations dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Signed in as {admin.name}. Product, stock, category, image, and
              order controls are isolated from customer shopping flows.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-white/10 px-4 py-3">
              <div className="text-2xl font-black">{products.length}</div>
              <div className="text-xs font-semibold text-slate-300">Products</div>
            </div>
            <div className="rounded-md bg-white/10 px-4 py-3">
              <div className="text-2xl font-black">{categories.length}</div>
              <div className="text-xs font-semibold text-slate-300">Categories</div>
            </div>
            <div className="rounded-md bg-white/10 px-4 py-3">
              <div className="text-2xl font-black">{orders.length}</div>
              <div className="text-xs font-semibold text-slate-300">Orders</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <PackagePlus className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Add product</h2>
            </div>
            <form action={createProduct} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Name
                <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Category
                <select name="categoryId" required className="rounded-md border border-slate-300 px-3 py-2">
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700 md:col-span-2">
                Description
                <textarea name="description" required rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Price
                <input name="price" required type="number" min="0" step="0.01" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Stock
                <input name="stock" required type="number" min="0" step="1" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Image URL
                <input name="imageUrl" type="url" placeholder="https://..." className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Upload image
                <input name="image" type="file" accept="image/*" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 md:col-span-2">
                <PackagePlus className="h-4 w-4" />
                Add product
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Boxes className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Manage products</h2>
            </div>
            <div className="mt-6 divide-y divide-slate-200">
              {products.map((product) => (
                <form key={product.id} action={updateProductManagement} className="grid gap-3 py-5 lg:grid-cols-[1fr_130px_110px_1fr_auto] lg:items-end">
                  <input type="hidden" name="productId" value={product.id} />
                  <div>
                    <p className="font-bold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{product.category.name}</p>
                  </div>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Price
                    <input name="price" required type="number" min="0" step="0.01" defaultValue={product.price.toString()} className="rounded-md border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Stock
                    <input name="stock" required type="number" min="0" step="1" defaultValue={product.stock} className="rounded-md border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Image
                    <span className="grid grid-cols-2 gap-2">
                      <input name="imageUrl" type="url" defaultValue={product.imageUrl ?? ""} className="min-w-0 rounded-md border border-slate-300 px-3 py-2" />
                      <input name="image" type="file" accept="image/*" className="min-w-0 rounded-md border border-slate-300 px-3 py-2" />
                    </span>
                  </label>
                  <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">
                    <ImageUp className="h-4 w-4" />
                    Save
                  </button>
                </form>
              ))}
              {products.length === 0 ? (
                <p className="py-6 text-sm text-slate-500">No products yet.</p>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Tags className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Categories</h2>
            </div>
            <form action={createCategory} className="mt-5 flex gap-2">
              <input name="name" required placeholder="Category name" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" />
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                Add
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2">
              {categories.map((category) => (
                <span key={category.id} className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {category.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Orders</h2>
            </div>
            <div className="mt-5 space-y-4">
              {orders.map((order) => (
                <form key={order.id} action={updateOrderStatus} className="rounded-md border border-slate-200 p-4">
                  <input type="hidden" name="orderId" value={order.id} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{order.user.name}</p>
                      <p className="text-sm text-slate-500">{money(order.totalAmount)}</p>
                    </div>
                    <select name="status" defaultValue={order.status} className="rounded-md border border-slate-300 px-2 py-2 text-sm">
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3 text-sm text-slate-600">
                    {order.items.map((item) => (
                      <p key={item.id}>
                        {item.quantity} x {item.product.name}
                      </p>
                    ))}
                  </div>
                  <button className="mt-4 w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-900 hover:bg-slate-100">
                    Update order
                  </button>
                </form>
              ))}
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">No orders yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
