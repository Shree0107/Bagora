import { WhatsAppIcon } from "./Icons";
import { publicSettings } from "@/lib/env";

/** Floating "Chat with us" button. Hidden until NEXT_PUBLIC_WHATSAPP_NUMBER is set. */
export function WhatsAppButton() {
  const number = publicSettings.whatsappNumber();
  if (!number) return null;
  const text = encodeURIComponent("Hello VÉRANE, I have a question about a bag.");
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="no-print fixed right-4 bottom-4 z-30 flex h-14 w-14 items-center justify-center border border-gilt bg-forest text-gilt-pale shadow-[0_8px_24px_-8px_rgb(22_41_31/0.55)] transition-colors hover:bg-forest-deep sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon size={26} />
    </a>
  );
}

/** Inline WhatsApp link (product page, contact page). */
export function WhatsAppLink({ message, className = "" }: Readonly<{ message: string; className?: string }>) {
  const number = publicSettings.whatsappNumber();
  if (!number) return null;
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <WhatsAppIcon size={18} />
      Ask us on WhatsApp
    </a>
  );
}
