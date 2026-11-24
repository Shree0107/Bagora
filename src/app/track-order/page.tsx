import type { Metadata } from "next";
import { InfoPage } from "@/components/content/InfoPage";
import { TrackOrderForm } from "@/components/content/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check the status of your VÉRANE order with your order number and email.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <InfoPage
      title="Track an order"
      intro="Enter the order number from your confirmation (it looks like #3F2A9C1B) and the email you ordered with."
    >
      <TrackOrderForm />
    </InfoPage>
  );
}
