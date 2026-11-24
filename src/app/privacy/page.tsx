import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/content/InfoPage";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How VÉRANE collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

// ⚠️ TEMPLATE. Have this reviewed by a lawyer (India's DPDP Act 2023) and add your legal entity name and grievance officer before launch.
export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy" intro="We collect only what we need to deliver your order and look after you, and we never sell your data.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your name and email when you create an account.</li>
        <li><strong>Orders:</strong> delivery address, mobile number, the items you buy and how you paid.</li>
        <li><strong>Messages:</strong> what you send us through the contact form, and reviews you choose to publish.</li>
        <li><strong>Newsletter:</strong> your email, if you subscribe.</li>
      </ul>
      <p>We do not see or store your card, UPI or bank details. Online payments are handled by Razorpay.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To process, deliver and support your orders, including returns and refunds.</li>
        <li>To issue GST invoices and meet our legal and accounting obligations.</li>
        <li>To reply to your messages.</li>
        <li>To send our newsletter, only if you subscribed. You can unsubscribe anytime.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>Only the services needed to run the store, each for its own purpose:</p>
      <ul>
        <li>Razorpay (payments), our courier partners (delivery), and Supabase (secure hosting of accounts and orders).</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use only the cookies needed to keep you signed in and remember your bag. No advertising cookies.</p>

      <h2>Your rights</h2>
      <p>
        You can ask us to see, correct or delete your personal data, or withdraw consent for the newsletter, through the{" "}
        <Link href="/contact">contact page</Link>. Some order records must be kept for tax purposes.
      </p>

      <h2>Contact</h2>
      <p>For any privacy question, write to us through the <Link href="/contact">contact page</Link>.</p>
    </InfoPage>
  );
}
