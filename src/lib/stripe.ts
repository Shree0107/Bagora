import "server-only";
import Stripe from "stripe";
import { stripeSecretKey } from "@/lib/env";

let client: Stripe | null = null;

/** Lazily created Stripe client (server only). */
export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(stripeSecretKey(), {
      appInfo: { name: "Bagora" },
    });
  }
  return client;
}
