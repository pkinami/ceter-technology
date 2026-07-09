import type { Metadata } from "next";
import { CartView } from "./view";

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review items in your CETER Technology shopping cart.",
};

export default function CartPage() {
  return <CartView />;
}
