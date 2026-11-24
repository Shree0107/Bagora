import type { Metadata } from "next";
import Link from "next/link";
import { Faq, InfoPage } from "@/components/content/InfoPage";
import { ContactForm } from "@/components/content/ContactForm";
import { InstagramIcon, WhatsAppIcon } from "@/components/layout/Icons";
import { INSTAGRAM_HANDLE, PREPAID_DISCOUNT_RATE, RETURN_DAYS } from "@/lib/config";
import { publicSettings } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact & FAQ",
  description: "Questions about a VÉRANE bag, delivery, payment or returns? Find answers here or write to us.",
  alternates: { canonical: "/contact" },
};

// ⚠️ Owner to review: confirm return days, damage window and invoice wording match your actual policies.
export default function ContactPage() {
  const whatsapp = publicSettings.whatsappNumber();
  const email = publicSettings.supportEmail();
  const pct = Math.round(PREPAID_DISCOUNT_RATE * 100);

  return (
    <InfoPage
      title="Contact & FAQ"
      intro="Questions about a bag, your order or a return? The answers to most are below. For anything else, write to us; a person replies."
      aside={
        <div className="space-y-8">
          <div className="bg-ivory-deep p-6 sm:p-8">
            <h2 className="font-display text-[28px] leading-none text-espresso">Write to us</h2>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
          <ul className="space-y-3 text-[15px]">
            {whatsapp && (
              <li>
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 text-forest underline decoration-gilt underline-offset-4">
                  <WhatsAppIcon size={20} /> Chat on WhatsApp
                </a>
              </li>
            )}
            {email && (
              <li>
                <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center text-forest underline decoration-gilt underline-offset-4">{email}</a>
              </li>
            )}
            <li>
              <a href={`https://instagram.com/${INSTAGRAM_HANDLE}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 text-forest underline decoration-gilt underline-offset-4">
                <InstagramIcon /> @{INSTAGRAM_HANDLE}
              </a>
            </li>
          </ul>
        </div>
      }
    >
      <h2>Orders &amp; delivery</h2>
      <Faq q="How much is delivery?">Delivery is free on every order across India.</Faq>
      <Faq q="How do I track my order?">
        Use <Link href="/track-order" className="text-forest underline">Track an order</Link> with your order number and email, or
        open the order in <Link href="/account" className="text-forest underline">your account</Link>. We share courier tracking as soon as your bag ships.
      </Faq>
      <Faq q="Can I change my address after ordering?">
        Write to us as soon as possible with your order number. If your bag hasn&apos;t shipped yet, we&apos;ll update it.
      </Faq>

      <h2>Payment</h2>
      <Faq q="Which payment methods do you accept?">
        UPI, debit and credit cards, netbanking and wallets through Razorpay, or cash on delivery.
      </Faq>
      <Faq q={`Why is paying online ${pct}% cheaper?`}>
        Online payments save us the cost of handling cash, so we pass that saving to you: {pct}% off your order subtotal, applied at checkout.
      </Faq>
      <Faq q="Is cash on delivery available?">
        Yes. Choose &ldquo;Cash on delivery&rdquo; at checkout and pay in cash or UPI when your bag arrives. There is no extra fee.
      </Faq>
      <Faq q="Do prices include GST? Will I get an invoice?">
        Yes, every price includes GST. A GST invoice is available for your order in your account.
      </Faq>

      <h2>Returns</h2>
      <Faq q="What is your return policy?">
        You can return an unused bag in its original condition within {RETURN_DAYS} days of delivery. See{" "}
        <Link href="/shipping-returns" className="text-forest underline">Shipping &amp; returns</Link> for the details.
      </Faq>
      <Faq q="My bag arrived damaged. What should I do?">
        We&apos;re sorry. Write to us within 48 hours of delivery with your order number and a photo, and we&apos;ll make it right.
      </Faq>

      <h2>Our bags</h2>
      <Faq q="Is the leather genuine?">Yes. The leather used is named on every product page, under &ldquo;Leather &amp; hardware&rdquo;.</Faq>
      <Faq q="Will my laptop fit?">
        Each product page lists the exact dimensions and what fits inside (phone, tablet, 13&Prime; or 14&Prime; laptop, bottle) under &ldquo;Size &amp; what fits&rdquo;.
      </Faq>
      <Faq q="How do I care for my bag?">
        Wipe with a soft dry cloth, condition the leather every few months, and keep it away from heat and direct sun. Each product page has a full care guide.
      </Faq>
    </InfoPage>
  );
}
