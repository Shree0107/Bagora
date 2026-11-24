import Link from "next/link";
import {
  BottleIcon,
  ChevronIcon,
  DocumentIcon,
  LaptopIcon,
  LockIcon,
  PhoneIcon,
  ReceiptIcon,
  ReturnIcon,
  TabletIcon,
  TruckIcon,
} from "@/components/layout/Icons";
import { RETURN_DAYS } from "@/lib/config";
import type { Product } from "@/types/database";

/** Free delivery · returns · secure payment · GST invoice. */
export function TrustRow({ className = "" }: Readonly<{ className?: string }>) {
  const items = [
    { icon: <TruckIcon />, text: "Free delivery across India" },
    { icon: <ReturnIcon />, text: `${RETURN_DAYS}-day easy returns` },
    { icon: <LockIcon />, text: "Secure payment by Razorpay" },
    { icon: <ReceiptIcon />, text: "GST invoice with every order" },
  ];
  return (
    <ul className={`grid grid-cols-2 gap-x-4 gap-y-4 border-y border-line py-5 text-[14px] text-espresso ${className}`}>
      {items.map((i) => (
        <li key={i.text} className="flex items-center gap-3">
          <span className="shrink-0 text-forest">{i.icon}</span>
          {i.text}
        </li>
      ))}
    </ul>
  );
}

const FITS: Record<string, { label: string; icon: React.ReactNode }> = {
  phone: { label: "Phone", icon: <PhoneIcon /> },
  tablet: { label: "Tablet", icon: <TabletIcon /> },
  "laptop-13": { label: '13" laptop', icon: <LaptopIcon /> },
  "laptop-14": { label: '14" laptop', icon: <LaptopIcon /> },
  "laptop-16": { label: '16" laptop', icon: <LaptopIcon /> },
  bottle: { label: "500 ml bottle", icon: <BottleIcon /> },
  a4: { label: "A4 documents", icon: <DocumentIcon /> },
};

function Section({ title, open = false, children }: Readonly<{ title: string; open?: boolean; children: React.ReactNode }>) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] text-espresso [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronIcon className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <div className="pb-6 text-[15px] leading-relaxed text-muted">{children}</div>
    </details>
  );
}

/** Product facts in quiet accordions: description, size & what fits, materials, care, delivery. */
export function ProductDetails({ product }: Readonly<{ product: Product }>) {
  const dims = [
    product.width_cm && `Width ${num(product.width_cm)} cm`,
    product.height_cm && `Height ${num(product.height_cm)} cm`,
    product.depth_cm && `Depth ${num(product.depth_cm)} cm`,
    product.strap_drop_cm && `Strap drop ${num(product.strap_drop_cm)} cm`,
    product.weight_g && `Weight ${product.weight_g} g`,
  ].filter(Boolean) as string[];
  const fits = product.fits.filter((f) => FITS[f]);

  return (
    <div className="border-t border-line">
      <Section title="Description" open>
        <p className="text-espresso">{product.description}</p>
      </Section>

      {(dims.length > 0 || fits.length > 0) && (
        <Section title="Size & what fits">
          {dims.length > 0 && (
            <ul className="tabular grid grid-cols-2 gap-x-6 gap-y-1">
              {dims.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          {fits.length > 0 && (
            <>
              <p className="mt-5 text-espresso">Fits inside</p>
              <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fits.map((f) => (
                  <li key={f} className="flex flex-col items-center gap-2 border border-line px-2 py-4 text-center text-[13px] text-espresso">
                    <span className="text-forest">{FITS[f].icon}</span>
                    {FITS[f].label}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
      )}

      {(product.leather || product.hardware || product.lining) && (
        <Section title="Leather & hardware">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {product.leather && (
              <>
                <dt className="text-espresso">Leather</dt>
                <dd>{product.leather}</dd>
              </>
            )}
            {product.hardware && (
              <>
                <dt className="text-espresso">Hardware</dt>
                <dd>{product.hardware}</dd>
              </>
            )}
            {product.lining && (
              <>
                <dt className="text-espresso">Lining</dt>
                <dd>{product.lining}</dd>
              </>
            )}
          </dl>
          <p className="mt-4">Genuine leather is a natural material: small marks and variations in grain are part of its character.</p>
        </Section>
      )}

      <Section title="Care guide">
        <ul className="list-disc space-y-1.5 pl-5 marker:text-gilt">
          <li>Wipe with a soft, dry cloth. Avoid water, alcohol and household cleaners.</li>
          <li>Condition the leather with a neutral leather balm every few months.</li>
          <li>Keep it away from direct sunlight and heat, which can fade and dry leather.</li>
          <li>Store it stuffed with tissue, in a dust bag or cotton cover, so it keeps its shape.</li>
          <li>If it gets wet, blot gently and let it dry naturally, away from heat.</li>
        </ul>
      </Section>

      <Section title="Delivery & returns">
        <p>
          Free standard delivery across India. Pay online (UPI, cards, netbanking, wallets) and save{" "}
          5%, or pay in cash on delivery.
        </p>
        <p className="mt-3">
          Changed your mind? Return unused bags within {RETURN_DAYS} days of delivery.{" "}
          <Link href="/shipping-returns" className="text-forest underline decoration-gilt underline-offset-4">
            Shipping &amp; returns
          </Link>
        </p>
      </Section>
    </div>
  );
}

const num = (n: number) => (Number.isInteger(Number(n)) ? String(Number(n)) : Number(n).toFixed(1));
