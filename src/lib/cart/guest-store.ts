"use client";

import type { CartLine } from "./types";

/**
 * Guest cart stored in localStorage, exposed as a tiny external store for
 * React's useSyncExternalStore (keeps tabs in sync via the "storage" event).
 *
 * The pre-relaunch cart ("bagora-cart-v1", no colours) is read once; its lines
 * get an empty variantId, which CartProvider resolves to each bag's default
 * colour and then saves under the new key.
 */

const KEY = "verane-cart-v2";
const LEGACY_KEY = "bagora-cart-v1";
const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;

function isLine(x: unknown): x is CartLine {
  if (typeof x !== "object" || x === null) return false;
  const l = x as Record<string, unknown>;
  return (
    typeof l.productId === "string" &&
    typeof l.variantId === "string" &&
    typeof l.quantity === "number" &&
    l.quantity > 0
  );
}

function parse(raw: string | null): unknown[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const current = parse(window.localStorage.getItem(KEY)).filter(isLine);
    const legacy = parse(window.localStorage.getItem(LEGACY_KEY))
      .map((x) => ({ ...(x as object), variantId: "" }))
      .filter(isLine);
    cache = legacy.length ? [...current, ...legacy] : current.length ? current : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function emit() {
  listeners.forEach((l) => l());
}

export const guestCart = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,
  set(lines: CartLine[]) {
    cache = lines;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Storage full or blocked (private mode): the cart still works for this tab.
    }
    emit();
  },
  clear() {
    cache = EMPTY;
    try {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
    emit();
  },
};
