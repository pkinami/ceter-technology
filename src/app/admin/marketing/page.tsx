import type { Metadata } from "next";
import { BadgePercent, Mail, Megaphone, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { money, formatDate } from "../utils";
import { createCoupon, createMarketingCampaign } from "../actions";

export const metadata: Metadata = {
  title: "Admin Marketing",
  description: "Manage CETER Technology campaigns, coupons, featured products, and newsletter subscribers.",
};

export const dynamic = "force-dynamic";

export default async function AdminMarketingPage() {
  const [products, campaigns, coupons, subscribers] = await Promise.all([
    prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
      orderBy: { name: "asc" },
    }),
    prisma.marketingCampaign.findMany({
      include: { products: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const featuredProducts = products.filter((product) => product.badges.length > 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Megaphone className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Discount campaign</h2>
            </div>
            <form action={createMarketingCampaign} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Campaign name
                <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Discount percentage
                  <input name="discountPercentage" required type="number" min="0" max="100" defaultValue={10} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select name="status" defaultValue="ACTIVE" className="rounded-md border border-slate-300 px-3 py-2">
                    <option value="ACTIVE">Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PAUSED">Paused</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Start date
                  <input name="startsAt" required type="date" className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  End date
                  <input name="endsAt" required type="date" className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <fieldset className="grid max-h-56 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                <legend className="px-1">Products included</legend>
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2">
                    <input type="checkbox" name="productIds" value={product.id} className="accent-orange-500" />
                    {product.name}
                  </label>
                ))}
              </fieldset>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
                <Megaphone className="h-4 w-4" />
                Create campaign
              </button>
            </form>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BadgePercent className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Coupon</h2>
            </div>
            <form action={createCoupon} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Code
                  <input name="code" required placeholder="CETER10" className="rounded-md border border-slate-300 px-3 py-2 uppercase" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Discount
                  <input name="discountPercentage" required type="number" min="0" max="100" defaultValue={10} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Minimum order
                  <input name="minimumOrderAmount" required type="number" min="0" step="0.01" defaultValue={0} className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Expiry date
                  <input name="expiresAt" required type="date" className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Usage limit
                  <input name="usageLimit" type="number" min="1" className="rounded-md border border-slate-300 px-3 py-2" />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                Active coupon
              </label>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                <BadgePercent className="h-4 w-4" />
                Create coupon
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Featured product flags</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Set Featured, New arrival, Best seller, and Promotion labels from the product edit screen.
            </p>
            <div className="mt-5 grid gap-3">
              {featuredProducts.map((product) => (
                <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 p-3 text-sm">
                  <span className="font-bold text-slate-950">{product.name}</span>
                  <span className="text-slate-600">{product.badges.join(", ")}</span>
                </div>
              ))}
              {featuredProducts.length === 0 ? (
                <p className="text-sm text-slate-500">No products are flagged for homepage merchandising yet.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Campaigns</h2>
              <div className="mt-5 grid gap-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-md border border-slate-200 p-4">
                    <p className="font-black text-slate-950">{campaign.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{campaign.discountPercentage}% off - {campaign.status}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(campaign.startsAt)} to {formatDate(campaign.endsAt)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {campaign.products.map((item) => item.product.name).join(", ") || "No products selected"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">Coupons</h2>
              <div className="mt-5 grid gap-4">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="rounded-md border border-slate-200 p-4">
                    <p className="font-black text-slate-950">{coupon.code}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {coupon.discountPercentage}% off, min {money(coupon.minimumOrderAmount)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Expires {formatDate(coupon.expiresAt)} - used {coupon.usageCount}
                      {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black text-slate-950">Newsletter subscribers</h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Export-ready subscriber data for Mailchimp, Brevo, or SendGrid.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Source</th>
                    <th className="py-3">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td className="py-3 pr-4 font-bold text-slate-950">{subscriber.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{subscriber.source}</td>
                      <td className="py-3 text-slate-500">{formatDate(subscriber.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscribers.length === 0 ? (
                <p className="py-5 text-sm text-slate-500">No subscribers yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
