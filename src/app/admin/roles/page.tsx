import { redirect } from "next/navigation";

export default function RemovedRolesPage() {
  redirect("/admin?notice=single-owner-mode");
}
