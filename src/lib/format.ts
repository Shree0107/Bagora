import { CURRENCY, LOCALE } from "./config";

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY.toUpperCase(),
});

/** 18900 -> "€189.00" */
export function formatPrice(cents: number): string {
  return money.format(cents / 100);
}

const dateFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });

export function formatDate(iso: string): string {
  return dateFmt.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTimeFmt.format(new Date(iso));
}

/** Short, human friendly order number from a UUID: "#3F2A9C1B" */
export function orderNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** "Heritage Tote!" -> "heritage-tote" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
