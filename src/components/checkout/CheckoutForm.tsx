"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCartDetails } from "@/components/cart/useCartDetails";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ProductImage } from "@/components/product/ProductImage";
import { CashIcon, LockIcon, ReceiptIcon, ReturnIcon } from "@/components/layout/Icons";
import { button, input, label } from "@/components/ui/styles";
import { INDIAN_STATE_NAMES, validateAddress, type DeliveryAddress } from "@/lib/address";
import { includedTax } from "@/lib/markets";
import { SHIPPING_METHODS, shippingCost } from "@/lib/shipping";
import { PREPAID_DISCOUNT_RATE, RETURN_DAYS } from "@/lib/config";

type Fields = Omit<DeliveryAddress, "country">;
type FieldErrors = Partial<Record<keyof Fields | "country", string>>;
type PayMethod = "razorpay" | "cod";

type RazorpayPayload = {
  provider: "razorpay";
  orderId: string;
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  prefill: { name: string; email: string; contact: string };
};
type CheckoutResponse =
  | RazorpayPayload
  | { provider: "cod"; orderId: string }
  | { alreadyPaid: true; orderId: string }
  | { error: string; code?: string; fieldErrors?: FieldErrors };

type RazorpayResponse = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayInstance = { open: () => void; on: (event: string, cb: (resp: { error?: { description?: string } }) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Load Razorpay's official Checkout script once. */
function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const EMPTY: Fields = { fullName: "", line1: "", line2: "", city: "", postalCode: "", state: "", phone: "" };

/**
 * One calm page: address → delivery → payment (online with 5% off, or cash on
 * delivery). The same validation and all pricing run again on the server.
 * A payment is only shown as successful after the server has verified it.
 */
export function CheckoutForm({
  email,
  defaultName,
  onlineAvailable,
}: Readonly<{ email: string; defaultName: string; onlineAvailable: boolean }>) {
  const router = useRouter();
  const { t, money } = useLocale();
  const { lines, items, loading, subtotal, prepaidDiscount, canCheckout } = useCartDetails();

  const method = SHIPPING_METHODS[0];
  const [fields, setFields] = useState<Fields>({ ...EMPTY, fullName: defaultName });
  const [pay, setPay] = useState<PayMethod>(onlineAvailable ? "razorpay" : "cod");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per checkout attempt; a new one whenever the customer edits anything.
  const [checkoutKey, setCheckoutKey] = useState(() => crypto.randomUUID());

  const shipping = shippingCost(method, subtotal);
  const discount = pay === "razorpay" ? prepaidDiscount : 0;
  const total = subtotal + shipping - discount;

  function update<K extends keyof Fields>(key: K, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setCheckoutKey(crypto.randomUUID());
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = validateAddress({ ...fields, country: "IN" });
    if (!result.ok) {
      setErrors(Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [k, v ? t(v) : v])));
      setError("Please check the highlighted fields.");
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setBusy(true);
    let data: CheckoutResponse;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.filter((l) => l.variantId),
          address: { ...fields, country: "IN" },
          shippingMethod: method.id,
          paymentMethod: pay,
          checkoutKey,
        }),
      });
      data = await res.json();
    } catch {
      setBusy(false);
      setError("We couldn't reach the server. Please check your connection and try again.");
      return;
    }

    if ("alreadyPaid" in data) return router.push(`/checkout/success?order=${data.orderId}`);
    if ("error" in data) {
      setBusy(false);
      if (data.code === "expired") setCheckoutKey(crypto.randomUUID());
      if (data.fieldErrors) setErrors(data.fieldErrors);
      setError(data.code === "expired" ? "That checkout expired. Please place your order again." : data.error);
      return;
    }
    if (data.provider === "cod") return router.push(`/checkout/success?order=${data.orderId}`);
    await openRazorpay(data);
  }

  async function openRazorpay(p: RazorpayPayload) {
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setBusy(false);
      setError("Online payment couldn't load. Please try again, or choose cash on delivery.");
      return;
    }
    const rzp = new window.Razorpay({
      key: p.keyId,
      order_id: p.razorpayOrderId,
      amount: p.amount,
      currency: p.currency,
      name: p.name,
      description: "Genuine leather handbags",
      prefill: p.prefill,
      theme: { color: "#1f3a2e" },
      config: {
        display: {
          blocks: {
            upi: { name: "Pay with UPI", instruments: [{ method: "upi" }] },
            other: { name: "Cards, netbanking & wallets", instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }] },
          },
          sequence: ["block.upi", "block.other"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: async (resp: RazorpayResponse) => {
        // Never trust this callback alone: the server verifies signature + payment.
        const res = await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: p.orderId, ...resp }),
        }).catch(() => null);
        if (res && (res.ok || res.status >= 500)) {
          // Paid, or confirmation pending: the success page polls until the webhook lands.
          router.push(`/checkout/success?order=${p.orderId}`);
        } else {
          setBusy(false);
          setError("We couldn't confirm your payment yet. If money left your account, it will be matched to your order automatically.");
        }
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setError("Payment was not completed. Your bag is still here; you can try again or choose cash on delivery.");
        },
      },
    });
    rzp.on("payment.failed", (resp) => {
      setError(`The payment didn't go through: ${resp.error?.description ?? "please try another method"}.`);
    });
    rzp.open();
  }

  if (lines.length === 0) {
    return (
      <div className="py-10">
        <p className="text-[17px] text-muted">Your bag is empty, so there is nothing to check out yet.</p>
        <Link href="/shop" className={`${button.primary} mt-6`}>
          Discover the collection
        </Link>
      </div>
    );
  }

  const field = (key: keyof Fields, labelText: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={key} className={label}>
        {labelText}
      </label>
      <input
        id={key}
        name={key}
        value={fields[key]}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={Boolean(errors[key])}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        className={`${input} ${errors[key] ? "border-danger" : ""}`}
        {...props}
      />
      {errors[key] && (
        <p id={`${key}-error`} className="mt-1.5 text-sm text-danger">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const step = "font-display text-[28px] leading-none text-espresso";

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="space-y-14">
        <section aria-labelledby="addr-title">
          <h2 id="addr-title" className={step}>Delivery address</h2>
          <p className="mt-2 text-[15px] text-muted">We deliver across India. Order updates go to {email}.</p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("fullName", "Full name", { autoComplete: "name", required: true })}</div>
            <div className="sm:col-span-2">{field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", type: "tel", required: true, placeholder: "10-digit mobile number" })}</div>
            <div className="sm:col-span-2">{field("line1", "House, building, street", { autoComplete: "address-line1", required: true })}</div>
            <div className="sm:col-span-2">{field("line2", "Area, landmark (optional)", { autoComplete: "address-line2" })}</div>
            {field("postalCode", "PIN code", { autoComplete: "postal-code", inputMode: "numeric", maxLength: 6, required: true })}
            {field("city", "City", { autoComplete: "address-level2", required: true })}
            <div className="sm:col-span-2">
              <label htmlFor="state" className={label}>State</label>
              <select
                id="state"
                value={fields.state}
                onChange={(e) => update("state", e.target.value)}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={errors.state ? "state-error" : undefined}
                autoComplete="address-level1"
                className={`${input} ${errors.state ? "border-danger" : ""}`}
                required
              >
                <option value="">Select your state</option>
                {INDIAN_STATE_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p id="state-error" className="mt-1.5 text-sm text-danger">{errors.state}</p>}
            </div>
          </div>
        </section>

        <section aria-labelledby="ship-title">
          <h2 id="ship-title" className={step}>Delivery</h2>
          <div className="mt-5 flex items-center justify-between gap-4 border border-forest bg-white/50 p-5">
            <div>
              <p className="text-[15px] text-espresso">{method.label}</p>
              <p className="text-sm text-muted">{method.estimate ?? "We share tracking as soon as your bag ships."}</p>
            </div>
            <p className="tabular text-[15px] text-espresso">{shipping === 0 ? "Free" : money(shipping)}</p>
          </div>
        </section>

        <section aria-labelledby="pay-title">
          <h2 id="pay-title" className={step}>Payment</h2>
          <div className="mt-5 space-y-3" role="radiogroup" aria-labelledby="pay-title">
            <PayOption
              checked={pay === "razorpay"}
              disabled={!onlineAvailable}
              onSelect={() => { setPay("razorpay"); setCheckoutKey(crypto.randomUUID()); }}
              title="Pay online"
              detail={onlineAvailable ? "UPI, cards, netbanking and wallets, secured by Razorpay." : "Online payment is unavailable right now."}
              badge={onlineAvailable && prepaidDiscount > 0 ? `Save ${money(prepaidDiscount)}` : undefined}
              icon={<LockIcon />}
            />
            <PayOption
              checked={pay === "cod"}
              onSelect={() => { setPay("cod"); setCheckoutKey(crypto.randomUUID()); }}
              title="Cash on delivery"
              detail="Pay in cash or UPI when your bag arrives."
              icon={<CashIcon />}
            />
          </div>
        </section>
      </div>

      <aside className="h-fit bg-ivory-deep p-6 sm:p-8 lg:sticky lg:top-28" aria-labelledby="summary-title">
        <h2 id="summary-title" className={step}>Your order</h2>
        <ul className="mt-6 space-y-4">
          {items.map((i) => (
            <li key={i.variantId} className="flex items-center gap-4">
              <div className="w-16 shrink-0">
                <ProductImage src={i.imageUrl} alt={i.name} sizes="64px" zoom={false} />
              </div>
              <div className="flex-1 text-[15px]">
                <p className="text-espresso">{i.name}</p>
                <p className="text-sm text-muted">{i.colourName} · Qty {i.quantity}</p>
              </div>
              <p className="tabular text-[15px] text-espresso">{money(i.priceCents * i.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="tabular mt-6 space-y-2.5 border-t border-line pt-5 text-[15px]">
          <Row label="Subtotal" value={loading ? "…" : money(subtotal)} />
          {discount > 0 && <Row label={`Online payment (${Math.round(PREPAID_DISCOUNT_RATE * 100)}% off)`} value={`− ${money(discount)}`} accent />}
          <Row label="Delivery" value={shipping === 0 ? "Free" : money(shipping)} />
          <div className="flex justify-between border-t border-line pt-3 text-lg text-espresso">
            <dt>Total</dt>
            <dd>{loading ? "…" : money(total)}</dd>
          </div>
          <p className="text-[13px] text-muted">Includes GST of {money(includedTax(total))}.</p>
        </dl>

        {error && (
          <p role="alert" className="mt-5 border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={!canCheckout || busy} className={`${button.primary} mt-6 w-full`}>
          {busy ? "Please wait…" : pay === "cod" ? `Place order · ${money(total)}` : `Pay ${loading ? "" : money(total)} securely`}
        </button>

        <ul className="mt-6 space-y-2.5 text-[13px] text-muted">
          <li className="flex items-center gap-2.5"><LockIcon size={16} className="text-forest" /> Payments are encrypted and processed by Razorpay</li>
          <li className="flex items-center gap-2.5"><ReturnIcon size={16} className="text-forest" /> Easy returns within {RETURN_DAYS} days of delivery</li>
          <li className="flex items-center gap-2.5"><ReceiptIcon size={16} className="text-forest" /> GST invoice with your order</li>
        </ul>
        <Link href="/cart" className="mt-6 block text-center text-sm text-forest underline decoration-gilt underline-offset-4">
          Back to your bag
        </Link>
      </aside>
    </form>
  );
}

function Row({ label: l, value, accent }: Readonly<{ label: string; value: string; accent?: boolean }>) {
  return (
    <div className={`flex justify-between gap-4 ${accent ? "text-forest" : "text-espresso"}`}>
      <dt className={accent ? "" : "text-muted"}>{l}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PayOption({
  checked,
  disabled,
  onSelect,
  title,
  detail,
  badge,
  icon,
}: Readonly<{ checked: boolean; disabled?: boolean; onSelect: () => void; title: string; detail: string; badge?: string; icon: React.ReactNode }>) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-4 border p-5 transition-colors ${
        checked ? "border-forest bg-white/60" : "border-line hover:border-espresso/40"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input type="radio" name="payment" checked={checked} disabled={disabled} onChange={onSelect} className="mt-1 h-4 w-4 accent-forest" />
      <span className="mt-0.5 text-forest">{icon}</span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[15px] text-espresso">{title}</span>
          {badge && <span className="plate-label bg-forest px-2 py-1 text-[10px] text-gilt-pale">{badge}</span>}
        </span>
        <span className="mt-1 block text-sm text-muted">{detail}</span>
      </span>
    </label>
  );
}
