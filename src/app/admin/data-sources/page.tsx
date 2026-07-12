import type { Metadata } from "next";
import {
  DatabaseZap,
  Factory,
  FileSpreadsheet,
  Globe2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminActionForm, StatusBadge } from "../admin-feedback";
import {
  bootstrapPriorityManufacturers,
  createDataSource,
  createSupplier,
  deleteDataSource,
  syncMarketplace,
  updateDataSource,
} from "../actions";
import { formatDate } from "../utils";

export const metadata: Metadata = {
  title: "Data Sources | Admin",
  description: "Manage product intelligence data sources for CETER Technology.",
};

const dataSourceTypes = ["MANUFACTURER", "SUPPLIER", "DISTRIBUTOR", "RETAILER"];
const connectionTypes = ["API", "EXCEL", "CSV", "XML", "JSON", "WEB_CATALOGUE"];
const countries = ["KENYA", "INTERNATIONAL"];
const frequencies = ["HOURLY", "DAILY", "WEEKLY", "MONTHLY"];
const statuses = ["ACTIVE", "INACTIVE"];
const publicSourceTypes = [
  "Manufacturer websites",
  "Public product catalogues",
  "Public RSS feeds",
  "Public APIs",
  "Public JSON feeds",
  "Public XML feeds",
  "Distributor catalogues",
  "Approved supplier feeds",
];
const initialSourceGroups = [
  { label: "Printers", brands: ["HP", "Canon", "Epson", "Brother", "Kyocera", "Xerox", "Ricoh", "Zebra"] },
  { label: "Computers", brands: ["HP", "Dell", "Lenovo", "Asus", "Acer"] },
  { label: "Networking", brands: ["TP-Link", "Cisco", "Ubiquiti", "Mikrotik"] },
  { label: "Storage", brands: ["Kingston", "Samsung", "Western Digital", "Seagate"] },
  { label: "Power", brands: ["APC", "Eaton"] },
];

function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/^\w/, (item) => item.toUpperCase());
}

export default async function DataSourcesPage() {
  const [dataSources, manufacturers, suppliers] = await Promise.all([
    prisma.dataSource.findMany({
      include: {
        manufacturer: true,
        supplier: true,
        _count: {
          select: {
            productSources: true,
            supplierProducts: true,
            automationJobs: true,
            catalogueImports: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.manufacturer.findMany({ orderBy: [{ priority: "asc" }, { name: "asc" }] }),
    prisma.supplier.findMany({ orderBy: { name: "asc" } }),
  ]);
  const lastUpdated = dataSources[0]?.updatedAt ?? null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-orange-600">Automated source registry</p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            Public data sources replace manual catalogue uploads
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Register manufacturer, distributor, public feed, and approved supplier sources. Excel and CSV remain available as fallback inputs, not the primary catalogue workflow.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
              Source monitor live
            </span>
            <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
              Last updated {lastUpdated ? formatDate(lastUpdated) : "never"}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wide text-slate-950">Supported public sources</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {publicSourceTypes.map((type) => (
              <span key={type} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                {type}
              </span>
            ))}
          </div>
          <AdminActionForm
            action={syncMarketplace}
            className="mt-5"
            buttonClassName="w-full"
            icon="database"
            idleLabel="Start sync"
            pendingLabel="Syncing sources..."
            progressTitle="Source sync running"
            steps={["Connecting to active sources", "Checking feeds", "Processing products", "Updating source records"]}
            successTitle="Source sync completed"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <DatabaseZap className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Create data source</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Register manufacturer, supplier, distributor, retailer, catalogue, and import feeds.
                </p>
              </div>
            </div>

            <AdminActionForm
              action={createDataSource}
              className="mt-6 grid gap-4"
              icon="plug"
              idleLabel="Add source"
              pendingLabel="Adding source..."
              progressTitle="Creating data source"
              steps={["Validating connection settings", "Saving source", "Refreshing registry"]}
              successTitle="Data source added"
            >
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Data source name
                <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Type
                  <select name="type" required className="rounded-md border border-slate-300 px-3 py-2">
                    {dataSourceTypes.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Connection
                  <select name="connectionType" required className="rounded-md border border-slate-300 px-3 py-2">
                    {connectionTypes.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Country
                  <select name="country" defaultValue="KENYA" className="rounded-md border border-slate-300 px-3 py-2">
                    {countries.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Frequency
                  <select name="updateFrequency" defaultValue="DAILY" className="rounded-md border border-slate-300 px-3 py-2">
                    {frequencies.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select name="status" defaultValue="INACTIVE" className="rounded-md border border-slate-300 px-3 py-2">
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {label(item)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Base URL or endpoint
                <input name="baseUrl" type="url" placeholder="https://..." className="rounded-md border border-slate-300 px-3 py-2" />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Manufacturer
                  <select name="manufacturerId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2">
                    <option value="">None</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Supplier
                  <select name="supplierId" defaultValue="" className="rounded-md border border-slate-300 px-3 py-2">
                    <option value="">None</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Contact email
                <input name="contactEmail" type="email" className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Notes
                <textarea name="notes" rows={3} className="rounded-md border border-slate-300 px-3 py-2" />
              </label>

            </AdminActionForm>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Factory className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Manufacturer connectors</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Seed the priority brands for printers, computers, networking, storage, and power.
                </p>
              </div>
            </div>
            <AdminActionForm
              action={bootstrapPriorityManufacturers}
              className="mt-5"
              buttonClassName="min-h-10 border border-slate-300 bg-white px-3 py-2 font-bold text-slate-900 hover:bg-slate-100"
              icon="factory"
              idleLabel="Bootstrap priority brands"
              pendingLabel="Bootstrapping..."
              progressTitle="Preparing manufacturer connectors"
              steps={["Checking existing brands", "Saving priority connectors", "Refreshing source registry"]}
              successTitle="Priority brands ready"
            />
            <div className="mt-5 flex flex-wrap gap-2">
              {initialSourceGroups.map((group) => (
                <div key={group.label} className="w-full rounded-md bg-slate-50 p-3">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{group.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.brands.map((brand) => (
                      <span key={`${group.label}-${brand}`} className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-700">
                        {brand}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-orange-500" />
              <div>
                <h2 className="text-xl font-black text-slate-950">Future supplier</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add suppliers before API, Excel, CSV, XML, or JSON feeds are available.
                </p>
              </div>
            </div>
            <AdminActionForm
              action={createSupplier}
              className="mt-6 grid gap-4"
              icon="save"
              idleLabel="Save supplier"
              pendingLabel="Saving supplier..."
              progressTitle="Saving supplier"
              steps={["Validating supplier", "Saving contact details", "Refreshing suppliers"]}
              successTitle="Supplier saved"
            >
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Supplier name
                <input name="name" required className="rounded-md border border-slate-300 px-3 py-2" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Country
                  <select name="country" defaultValue="KENYA" className="rounded-md border border-slate-300 px-3 py-2">
                    {countries.map((item) => (
                      <option key={item} value={item}>{label(item)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select name="status" defaultValue="INACTIVE" className="rounded-md border border-slate-300 px-3 py-2">
                    {statuses.map((item) => (
                      <option key={item} value={item}>{label(item)}</option>
                    ))}
                  </select>
                </label>
              </div>
              <input name="contactName" placeholder="Contact name" className="rounded-md border border-slate-300 px-3 py-2" />
              <input name="email" type="email" placeholder="Email" className="rounded-md border border-slate-300 px-3 py-2" />
              <input name="phone" placeholder="Phone" className="rounded-md border border-slate-300 px-3 py-2" />
              <input name="website" type="url" placeholder="https://..." className="rounded-md border border-slate-300 px-3 py-2" />
            </AdminActionForm>
          </div>
        </aside>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Globe2 className="h-6 w-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-black text-slate-950">Source registry</h2>
              <p className="mt-1 text-sm text-slate-500">
                Active and planned feeds feeding product intelligence, catalogue generation, pricing, and inventory.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {dataSources.map((source) => (
              <article key={source.id} className="rounded-lg border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-slate-950">{source.name}</h3>
                      <StatusBadge status={source.status} />
                      <span className="rounded-md bg-orange-50 px-2 py-1 text-xs font-bold text-orange-700">
                        {label(source.connectionType)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {label(source.type)} - {label(source.country)} - {label(source.updateFrequency)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {source.manufacturer?.name ?? source.supplier?.name ?? "Unbound source"}
                    </p>
                  </div>
                  <AdminActionForm
                    action={deleteDataSource}
                    buttonClassName="min-h-10 border border-red-200 bg-white px-3 py-2 font-bold text-red-700 hover:bg-red-50"
                    confirmMessage={`Delete ${source.name}? This cannot be undone.`}
                    icon="trash"
                    idleLabel="Delete"
                    pendingLabel="Deleting..."
                    progressTitle="Deleting data source"
                    steps={["Checking source", "Deleting registry entry", "Refreshing dashboard"]}
                    successTitle="Data source deleted"
                  >
                    <input type="hidden" name="dataSourceId" value={source.id} />
                  </AdminActionForm>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-4">
                  <span>Products: <strong className="text-slate-950">{source._count.productSources}</strong></span>
                  <span>Supplier SKUs: <strong className="text-slate-950">{source._count.supplierProducts}</strong></span>
                  <span>Imports: <strong className="text-slate-950">{source._count.catalogueImports}</strong></span>
                  <span>Jobs: <strong className="text-slate-950">{source._count.automationJobs}</strong></span>
                  <span className="sm:col-span-4">Updated: <strong className="text-slate-950">{formatDate(source.updatedAt)}</strong></span>
                </div>

                <details className="mt-4 rounded-md bg-slate-50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-slate-950">Edit source</summary>
                  <AdminActionForm
                    action={updateDataSource}
                    className="mt-4 grid gap-4"
                    buttonClassName="bg-slate-950 hover:bg-slate-800"
                    icon="save"
                    idleLabel="Save changes"
                    pendingLabel="Saving changes..."
                    progressTitle="Updating data source"
                    steps={["Validating updates", "Saving source settings", "Refreshing registry"]}
                    successTitle="Data source updated"
                  >
                    <input type="hidden" name="dataSourceId" value={source.id} />
                    <input name="name" required defaultValue={source.name} className="rounded-md border border-slate-300 px-3 py-2" />
                    <div className="grid gap-4 md:grid-cols-5">
                      <select name="type" defaultValue={source.type} className="rounded-md border border-slate-300 px-3 py-2">
                        {dataSourceTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                      </select>
                      <select name="connectionType" defaultValue={source.connectionType} className="rounded-md border border-slate-300 px-3 py-2">
                        {connectionTypes.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                      </select>
                      <select name="country" defaultValue={source.country} className="rounded-md border border-slate-300 px-3 py-2">
                        {countries.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                      </select>
                      <select name="updateFrequency" defaultValue={source.updateFrequency} className="rounded-md border border-slate-300 px-3 py-2">
                        {frequencies.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                      </select>
                      <select name="status" defaultValue={source.status} className="rounded-md border border-slate-300 px-3 py-2">
                        {statuses.map((item) => <option key={item} value={item}>{label(item)}</option>)}
                      </select>
                    </div>
                    <input name="baseUrl" type="url" defaultValue={source.baseUrl ?? ""} placeholder="https://..." className="rounded-md border border-slate-300 px-3 py-2" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <select name="manufacturerId" defaultValue={source.manufacturerId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                        <option value="">No manufacturer</option>
                        {manufacturers.map((manufacturer) => (
                          <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>
                        ))}
                      </select>
                      <select name="supplierId" defaultValue={source.supplierId ?? ""} className="rounded-md border border-slate-300 px-3 py-2">
                        <option value="">No supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    </div>
                    <input name="contactEmail" type="email" defaultValue={source.contactEmail ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                    <textarea name="notes" rows={2} defaultValue={source.notes ?? ""} className="rounded-md border border-slate-300 px-3 py-2" />
                  </AdminActionForm>
                </details>
              </article>
            ))}

            {dataSources.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No sources yet. Bootstrap manufacturers or add a source to start the automation registry.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
