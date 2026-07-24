import { redirect } from "next/navigation";

export default function RemovedPermissionsPage() {
  redirect("/admin?notice=single-owner-mode");
}
