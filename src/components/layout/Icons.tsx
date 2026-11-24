/** One icon family: 24px grid, 1.25 stroke, round caps. Decorative unless labelled by the caller. */
type P = Readonly<{ className?: string; size?: number }>;

const svg = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className={className}
  >
    {children}
  </svg>
);

export const BagIcon = ({ className, size = 22 }: P) =>
  svg(size, className, (
    <>
      <path d="M5 8.5h14l-1.1 11.5H6.1L5 8.5Z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </>
  ));

export const MenuIcon = ({ className, size = 22 }: P) =>
  svg(size, className, (
    <>
      <path d="M4 8h16" />
      <path d="M4 16h11" />
    </>
  ));

export const CloseIcon = ({ className, size = 22 }: P) => svg(size, className, <path d="M6 6l12 12M18 6 6 18" />);

export const UserIcon = ({ className, size = 22 }: P) =>
  svg(size, className, (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
    </>
  ));

export const ArrowIcon = ({ className, size = 18 }: P) => svg(size, className, <path d="M5 12h14M14 7l5 5-5 5" />);

export const ChevronIcon = ({ className, size = 16 }: P) => svg(size, className, <path d="m6 9 6 6 6-6" />);

export const PlusIcon = ({ className, size = 16 }: P) => svg(size, className, <path d="M12 5v14M5 12h14" />);

export const MinusIcon = ({ className, size = 16 }: P) => svg(size, className, <path d="M5 12h14" />);

export const CheckIcon = ({ className, size = 16 }: P) => svg(size, className, <path d="m5 12.5 4.2 4L19 7" />);

export const ZoomIcon = ({ className, size = 18 }: P) =>
  svg(size, className, (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.5-4.5M11 8.5v5M8.5 11h5" />
    </>
  ));

export const StarIcon = ({ className, size = 14, filled = true }: P & { filled?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
    <path
      d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    />
  </svg>
);

/* What-fits pictograms (line drawings at the same stroke). */
export const PhoneIcon = ({ className, size = 28 }: P) =>
  svg(size, className, (
    <>
      <rect x="7.5" y="3" width="9" height="18" rx="1.8" />
      <path d="M11 18h2" />
    </>
  ));

export const TabletIcon = ({ className, size = 28 }: P) =>
  svg(size, className, (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.8" />
      <path d="M11 18h2" />
    </>
  ));

export const LaptopIcon = ({ className, size = 28 }: P) =>
  svg(size, className, (
    <>
      <rect x="5" y="5.5" width="14" height="10" rx="1" />
      <path d="M3 18.5h18" />
    </>
  ));

export const BottleIcon = ({ className, size = 28 }: P) =>
  svg(size, className, (
    <>
      <path d="M10 2.5h4v2.5l1.5 2v13a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 20V7l1.5-2V2.5Z" />
      <path d="M8.5 11h7" />
    </>
  ));

export const DocumentIcon = ({ className, size = 28 }: P) =>
  svg(size, className, (
    <>
      <path d="M6 3h8.5L18 6.5V21H6V3Z" />
      <path d="M9 10h6M9 13.5h6M9 17h4" />
    </>
  ));

/* Service marks */
export const TruckIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </>
  ));

export const ReturnIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <path d="M9 7 5 11l4 4" />
      <path d="M5 11h10a4 4 0 0 1 0 8h-3" />
    </>
  ));

export const LockIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ));

export const ReceiptIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <path d="M6 3h12v18l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3L6 21V3Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3" />
    </>
  ));

export const CashIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="1" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ));

export const WhatsAppIcon = ({ className, size = 24 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
    <path
      fill="currentColor"
      d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.3 21.8l4.9-1.3A9.7 9.7 0 1 0 12 2.2Zm0 17.7c-1.5 0-3-.4-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9Zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.2-.5Z"
    />
  </svg>
);

export const InstagramIcon = ({ className, size = 20 }: P) =>
  svg(size, className, (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </>
  ));
