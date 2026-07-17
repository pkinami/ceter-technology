import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { BadgePercent, CalendarDays, Mail, Megaphone, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "../delete-button";
import { money, formatDate } from "../utils";
import { createCoupon, createMarketingCampaign, deleteCoupon, deleteMarketingCampaign, deleteNewsletterSubscriber } from "../actions";

export const metadata: Metadata = {
  title: "Promotions & Marketing",
  description: "Campaign, coupon, featured product, and subscriber management.",
};

export const dynamic = "force-dynamic";

const campaignTypes = [
  "FLASH_SALE",
  "CATEGORY_DISCOUNT",
  "PRODUCT_PROMOTION",
  "SEASONAL_CAMPAIGN",
];

function campaignComputedStatus(status: string, startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (status !== "ACTIVE") return status;
  if (startsAt > now) return "SCHEDULED";
  if (endsAt < now) return "EXPIRED";
  return "ACTIVE";
}

export default async function AdminMarketingPage() {
  const [products, categories, campaigns, coupons, subscribers] = await Promise.all([
    prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "OUT_OF_STOCK"] } },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.category.findMany({ include: { parent: true }, orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }] }),
    prisma.marketingCampaign.findMany({
      include: {
        products: { include: { product: true } },
        categories: { include: { category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const featuredProducts = products.filter((product) => product.badges.length > 0);
  const activeCampaigns = campaigns.filter((campaign) => campaignComputedStatus(campaign.status, campaign.startsAt, campaign.endsAt) === "ACTIVE");

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-wide text-orange-600">Demand generation</p>
        <h1 className="text-2xl font-black text-slate-950">Promotions and marketing</h1>
        <p className="mt-1 text-sm text-slate-500">Flash sales, category discounts, product promotions, seasonal campaigns, coupons, and merchandising flags.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Metric icon={Megaphone} label="Active campaigns" value={activeCampaigns.length} />
        <Metric icon={CalendarDays} label="Scheduled campaigns" value={campaigns.filter((item) => campaignComputedStatus(item.status, item.startsAt, item.endsAt) === "SCHEDULED").length} />
        <Metric icon={Star} label="Featured products" value={featuredProducts.length} />
        <Metric icon={Mail} label="Subscribers" value={subscribers.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-black text-slate-950">Create campaign</h2>
            </div>
            <form action={createMarketingCampaign} className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Campaign name
                <input name="name" required className="h-10 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Campaign type
                <select name="campaignType" defaultValue="PRODUCT_PROMOTION" className="h-10 rounded-md border border-slate-300 px-3">
                  {campaignTypes.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Discount percentage
                  <input name="discountPercentage" required type="number" min="0" max="100" defaultValue={10} className="h-10 rounded-md border border-slate-300 px-3" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select name="status" defaultValue="ACTIVE" className="h-10 rounded-md border border-slate-300 px-3">
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
                  <input name="startsAt" required type="date" className="h-10 rounded-md border border-slate-300 px-3" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  End date
                  <input name="endsAt" required type="date" className="h-10 rounded-md border border-slate-300 px-3" />
                </label>
              </div>
              <fieldset className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                <legend className="px-1">Products included</legend>
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2">
                    <input type="checkbox" name="productIds" value={product.id} className="accent-orange-500" />
                    {product.name}
                  </label>
                ))}
              </fieldset>
              <fieldset className="grid max-h-48 gap-2 overflow-y-auto rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                <legend className="px-1">Categories included</legend>
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2">
                    <input type="checkbox" name="categoryIds" value={category.id} className="accent-orange-500" />
                    {category.parent ? `${category.parent.name} / ` : ""}{category.name}
                  </label>
                ))}
              </fieldset>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
                <Megaphone className="h-4 w-4" /> Create campaign
              </button>
            </form>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <BadgePercent className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-black text-slate-950">Coupon</h2>
            </div>
            <form action={createCoupon} className="mt-5 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Code
                  <input name="code" required placeholder="CETER10" className="h-10 rounded-md border border-slate-300 px-3 uppercase" />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Discount
                  <input name="discountPercentage" required type="number" min="0" max="100" defaultValue={10} className="h-10 rounded-md border border-slate-300 px-3" />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Minimum order
                <input name="minimumOrderAmount" required type="number" min="0" step="0.01" defaultValue={0} className="h-10 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Expiry date
                <input name="expiresAt" required type="date" className="h-10 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Usage limit
                <input name="usageLimit" type="number" min="1" className="h-10 rounded-md border border-slate-300 px-3" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input name="isActive" type="checkbox" defaultChecked className="accent-orange-500" />
                Active coupon
              </label>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                <BadgePercent className="h-4 w-4" /> Create coupon
              </button>
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">Campaign calendar</h2>
            <div className="mt-5 grid gap-4">
              {campaigns.map((campaign) => (
                <article key={campaign.id} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{campaign.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{campaign.campaignType.replaceAll("_", " ")} - {campaign.discountPercentage}% off</p>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{campaignComputedStatus(campaign.status, campaign.startsAt, campaign.endsAt)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(campaign.startsAt)} to {formatDate(campaign.endsAt)}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    Products: {campaign.products.map((item) => item.product.name).join(", ") || "None"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Categories: {campaign.categories.map((item) => item.category.name).join(", ") || "None"}
                  </p>
                  <form action={deleteMarketingCampaign} className="mt-4">
                    <input type="hidden" name="campaignId" value={campaign.id} />
                    <DeleteButton label={campaign.name} />
                  </form>
                </article>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Featured flags</h2>
              <div className="mt-5 grid gap-3">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="rounded-md bg-slate-50 p-3 text-sm">
                    <p className="font-bold text-slate-950">{product.name}</p>
                    <p className="mt-1 text-slate-600">{product.badges.join(", ")}</p>
                  </div>
                ))}
                {featuredProducts.length === 0 ? <p className="text-sm text-slate-500">No products are flagged yet.</p> : null}
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Coupons</h2>
              <div className="mt-5 grid gap-3">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-black text-slate-950">{coupon.code}</p>
                    <p className="mt-1 text-sm text-slate-600">{coupon.discountPercentage}% off, min {money(coupon.minimumOrderAmount)}</p>
                    <p className="mt-1 text-xs text-slate-500">Expires {formatDate(coupon.expiresAt)} - used {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}</p>
                    <form action={deleteCoupon} className="mt-3">
                      <input type="hidden" name="couponId" value={coupon.id} />
                      <DeleteButton label={coupon.code} />
                    </form>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-black text-slate-950">Newsletter subscribers</h2>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Subscribed</th><th className="py-3">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td className="py-3 pr-4 font-bold text-slate-950">{subscriber.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{subscriber.source}</td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(subscriber.createdAt)}</td>
                      <td className="py-3">
                        <form action={deleteNewsletterSubscriber}>
                          <input type="hidden" name="subscriberId" value={subscriber.id} />
                          <DeleteButton label={subscriber.email} />
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <Icon className="h-5 w-5 text-orange-500" />
      <p className="mt-3 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
