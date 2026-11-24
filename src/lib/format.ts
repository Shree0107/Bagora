// Money formatting lives in lib/markets.ts (formatMoney).

const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
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
