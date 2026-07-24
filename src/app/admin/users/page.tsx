import { redirect } from "next/navigation";

export default function RemovedUsersPage() {
  redirect("/admin?notice=single-owner-mode");
}
