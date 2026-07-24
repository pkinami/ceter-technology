import { redirect } from "next/navigation";

export default function RemovedCategoriesPage() {
  redirect("/admin/products?tab=categories");
}
