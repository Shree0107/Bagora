/**
 * A cart line only stores ids + quantity. Prices always come from the database.
 * `variantId` is the colour; an empty string marks a line from the old
 * (pre-variant) guest cart that the server resolves to the default colour.
 */
export type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
};

/** A cart line joined with fresh product data from the server, for display. */
export type CartLineDetails = CartLine & {
  name: string;
  slug: string;
  colourName: string;
  colourHex: string;
  /** Price in paise, GST included. */
  priceCents: number;
  /** Stock of this colour. */
  stock: number;
  imageUrl: string | null;
};
