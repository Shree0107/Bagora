/** A cart line only stores ids + quantity. Prices always come from the database. */
export type CartLine = {
  productId: string;
  quantity: number;
};

/** A cart line joined with fresh product data from the server, for display. */
export type CartLineDetails = CartLine & {
  name: string;
  slug: string;
  priceCents: number;
  stock: number;
  imageUrl: string | null;
};
