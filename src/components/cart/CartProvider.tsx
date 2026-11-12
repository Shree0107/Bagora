"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from "react";
import { guestCart } from "@/lib/cart/guest-store";
import {
  addToCartAction,
  clearCartAction,
  mergeGuestCartAction,
  setCartQuantityAction,
} from "@/lib/cart/actions";
import type { CartLine } from "@/lib/cart/types";
import { MAX_QTY_PER_ITEM } from "@/lib/config";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  isLoggedIn: boolean;
  isPending: boolean;
  add: (productId: string, quantity: number, maxQuantity?: number) => void;
  setQuantity: (productId: string, quantity: number, maxQuantity?: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Guests: cart lives in localStorage.
 * Logged in: cart lives in the cart_items table (initialLines comes from the
 * server). On first render after login, any guest items are merged in.
 *
 * The root layout renders this with key={userId} so it resets on login/logout.
 */
export function CartProvider({
  userId,
  initialLines,
  children,
}: {
  userId: string | null;
  initialLines: CartLine[];
  children: ReactNode;
}) {
  const isLoggedIn = Boolean(userId);
  const guestLines = useSyncExternalStore(
    guestCart.subscribe,
    guestCart.getSnapshot,
    guestCart.getServerSnapshot,
  );
  const [userLines, setUserLines] = useState<CartLine[]>(initialLines);
  const [isPending, startTransition] = useTransition();

  // Merge the guest cart into the account right after login.
  useEffect(() => {
    if (!isLoggedIn) return;
    const pending = guestCart.getSnapshot();
    if (pending.length === 0) return;
    mergeGuestCartAction(pending)
      .then((merged) => {
        setUserLines(merged);
        guestCart.clear();
      })
      .catch((err) => console.error("Could not merge guest cart", err));
  }, [isLoggedIn]);

  const lines = isLoggedIn ? userLines : guestLines;

  /** Run a server cart action with an optimistic local update. */
  const runServer = useCallback(
    (optimistic: CartLine[], action: () => Promise<CartLine[]>) => {
      const previous = userLines;
      setUserLines(optimistic);
      startTransition(async () => {
        try {
          setUserLines(await action());
        } catch (err) {
          console.error("Cart update failed", err);
          setUserLines(previous);
        }
      });
    },
    [userLines],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number, maxQuantity = MAX_QTY_PER_ITEM) => {
      const qty = Math.max(0, Math.min(quantity, maxQuantity, MAX_QTY_PER_ITEM));
      const next = upsertLine(lines, productId, qty);
      if (isLoggedIn) runServer(next, () => setCartQuantityAction(productId, qty));
      else guestCart.set(next);
    },
    [lines, isLoggedIn, runServer],
  );

  const add = useCallback(
    (productId: string, quantity: number, maxQuantity = MAX_QTY_PER_ITEM) => {
      const current = lines.find((l) => l.productId === productId)?.quantity ?? 0;
      const qty = Math.min(current + quantity, maxQuantity, MAX_QTY_PER_ITEM);
      const next = upsertLine(lines, productId, qty);
      if (isLoggedIn) runServer(next, () => addToCartAction(productId, quantity));
      else guestCart.set(next);
    },
    [lines, isLoggedIn, runServer],
  );

  const remove = useCallback((productId: string) => setQuantity(productId, 0), [setQuantity]);

  const clear = useCallback(() => {
    guestCart.clear();
    if (isLoggedIn) runServer([], clearCartAction);
  }, [isLoggedIn, runServer]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      isLoggedIn,
      isPending,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, isLoggedIn, isPending, add, setQuantity, remove, clear],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

function upsertLine(lines: CartLine[], productId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return lines.filter((l) => l.productId !== productId);
  const exists = lines.some((l) => l.productId === productId);
  return exists
    ? lines.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    : [...lines, { productId, quantity }];
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
