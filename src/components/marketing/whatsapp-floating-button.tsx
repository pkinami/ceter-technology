import { MessageCircle } from "lucide-react";
import { whatsappUrl } from "@/lib/whatsapp";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={whatsappUrl("Hello CETER Technology, I need assistance with an order.")}
      className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-600"
      aria-label="Chat with CETER Technology on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
