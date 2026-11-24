import { WhatsAppIcon } from "@/components/layout/Icons";

/** "Ask us on WhatsApp" link under the add-to-bag button (client-safe: number is passed in). */
export function WhatsAppHint({ number, message }: Readonly<{ number: string; message: string }>) {
  return (
    <a
      href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-11 items-center gap-2 text-[15px] text-forest underline decoration-gilt underline-offset-4"
    >
      <WhatsAppIcon size={18} />
      Ask us anything on WhatsApp
    </a>
  );
}
