import { z } from "zod";

/**
 * Delivery address rules (India only). Safe to import on server AND client:
 * the checkout form and /api/checkout use the SAME schema, so the rules
 * can't be bypassed by editing the request.
 *
 * Error messages are i18n keys (see lib/i18n/messages.ts → "addr.*").
 */

/** Indian states / union territories → allowed first digit(s) of the PIN code. */
export const INDIAN_STATES: Record<string, string> = {
  "Andaman and Nicobar Islands": "7",
  "Andhra Pradesh": "5",
  "Arunachal Pradesh": "7",
  Assam: "7",
  Bihar: "8",
  Chandigarh: "1",
  Chhattisgarh: "4",
  "Dadra and Nagar Haveli and Daman and Diu": "3",
  Delhi: "1",
  Goa: "4",
  Gujarat: "3",
  Haryana: "1",
  "Himachal Pradesh": "1",
  "Jammu and Kashmir": "1",
  Jharkhand: "8",
  Karnataka: "5",
  Kerala: "6",
  Ladakh: "1",
  Lakshadweep: "6",
  "Madhya Pradesh": "4",
  Maharashtra: "4",
  Manipur: "7",
  Meghalaya: "7",
  Mizoram: "7",
  Nagaland: "7",
  Odisha: "7",
  Puducherry: "56",
  Punjab: "1",
  Rajasthan: "3",
  Sikkim: "7",
  "Tamil Nadu": "6",
  Telangana: "5",
  Tripura: "7",
  "Uttar Pradesh": "2",
  Uttarakhand: "2",
  "West Bengal": "7",
};
export const INDIAN_STATE_NAMES = Object.keys(INDIAN_STATES);

/** Remove spaces, dots, dashes and brackets from a phone number. */
const compactPhone = (v: string) => v.replace(/[\s.\-()]/g, "");

const text = (min: number, max: number, key: string) =>
  z.string().trim().min(min, key).max(max, key).regex(/^[^<>{}\\]*$/, key);

const base = {
  fullName: text(2, 100, "addr.name"),
  line1: text(3, 120, "addr.line1"),
  line2: z.string().trim().max(120, "addr.line2").regex(/^[^<>{}\\]*$/, "addr.line2").optional().default(""),
  city: text(2, 80, "addr.city"),
};

const indiaSchema = z
  .object({
    ...base,
    country: z.literal("IN", "addr.country"),
    postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, "addr.pin"),
    state: z.string("addr.state").refine((s) => s in INDIAN_STATES, "addr.state"),
    phone: z
      .string()
      .transform(compactPhone)
      .pipe(z.string().regex(/^(?:\+91|0091|91|0)?[6-9]\d{9}$/, "addr.phoneIn"))
      .transform((v) => `+91${v.slice(-10)}`),
  })
  .refine((a) => !(a.state in INDIAN_STATES) || INDIAN_STATES[a.state].includes(a.postalCode[0]), {
    message: "addr.pinState",
    path: ["postalCode"],
  });

export type DeliveryAddress = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  state: string;
  country: "IN";
  phone: string; // E.164, e.g. +919876543210
};

export function addressSchema() {
  return indiaSchema;
}

export type AddressResult =
  | { ok: true; address: DeliveryAddress }
  | { ok: false; errors: Partial<Record<keyof DeliveryAddress, string>> };

/** Validate + normalise an address. Field errors are i18n keys. */
export function validateAddress(input: unknown): AddressResult {
  const parsed = indiaSchema.safeParse(input);
  if (parsed.success) return { ok: true, address: parsed.data as DeliveryAddress };
  const errors: Partial<Record<keyof DeliveryAddress, string>> = {};
  for (const issue of parsed.error.issues) {
    const field = (issue.path[0] ?? "country") as keyof DeliveryAddress;
    errors[field] ??= issue.message;
  }
  return { ok: false, errors };
}

/** Shape stored in orders.shipping_address (jsonb). */
export function toOrderAddress(a: DeliveryAddress) {
  return {
    name: a.fullName,
    phone: a.phone,
    address: {
      line1: a.line1,
      line2: a.line2 || null,
      city: a.city,
      state: a.state || null,
      postal_code: a.postalCode,
      country: a.country,
    },
  };
}
