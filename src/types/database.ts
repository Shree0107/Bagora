/**
 * Database types for the Supabase client, matching supabase/01–07 *.sql.
 *
 * Hand-written in the same shape the Supabase CLI generates. If you change the
 * schema you can regenerate them with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UserRole = "customer" | "admin";
export type OrderStatus = "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";
/** "fr" only exists on orders placed before the India-only relaunch. */
export type DbMarket = "fr" | "in";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
/** "stripe" only exists on orders placed before the India-only relaunch. */
export type PaymentProvider = "stripe" | "razorpay" | "cod";
export type ColourFamily =
  | "black"
  | "brown"
  | "tan"
  | "burgundy"
  | "green"
  | "cream"
  | "grey"
  | "blue"
  | "pink"
  | "other";
export type ReviewStatus = "published" | "hidden";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string };

type ProductDetails = {
  style_ref: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  strap_drop_cm: number | null;
  weight_g: number | null;
  fits: string[];
  leather: string | null;
  hardware: string | null;
  lining: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: Timestamps & {
          id: string;
          name: string;
          slug: string;
          description: string;
          image_url: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          image_url?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      products: {
        Row: Timestamps &
          ProductDetails & {
            id: string;
            category_id: string;
            name: string;
            slug: string;
            description: string;
            /** INR paise, GST included. null = not for sale. */
            price_inr_paise: number | null;
            /** Sum of active variant stock (kept in sync by a trigger). */
            stock: number;
            is_active: boolean;
            is_featured: boolean;
            updated_at: string;
          };
        Insert: Partial<ProductDetails> & {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          price_inr_paise?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProductDetails> & {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price_inr_paise?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: Timestamps & {
          id: string;
          product_id: string;
          colour_name: string;
          colour_hex: string;
          colour_family: ColourFamily;
          sku: string | null;
          stock: number;
          sort_order: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          colour_name: string;
          colour_hex?: string;
          colour_family?: ColourFamily;
          sku?: string | null;
          stock?: number;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          colour_name?: string;
          colour_hex?: string;
          colour_family?: ColourFamily;
          sku?: string | null;
          stock?: number;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: Timestamps & {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          url: string;
          alt?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          variant_id?: string | null;
          url?: string;
          alt?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      cart_items: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          product_id: string;
          variant_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          variant_id: string;
          quantity: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: Timestamps & {
          id: string;
          user_id: string | null;
          email: string;
          status: OrderStatus;
          subtotal_cents: number;
          shipping_cents: number;
          discount_cents: number;
          total_cents: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          shipping_address: Json | null;
          paid_at: string | null;
          updated_at: string;
          market: DbMarket;
          language: "en" | "fr";
          payment_provider: PaymentProvider | null;
          payment_status: PaymentStatus;
          payment_method: string | null;
          tax_cents: number;
          prices_include_tax: boolean;
          shipping_method: string | null;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          checkout_key: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          status?: OrderStatus;
          subtotal_cents: number;
          shipping_cents?: number;
          discount_cents?: number;
          total_cents: number;
          currency?: string;
          shipping_address?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
          market?: DbMarket;
          language?: "en" | "fr";
          payment_provider?: PaymentProvider | null;
          payment_status?: PaymentStatus;
          payment_method?: string | null;
          tax_cents?: number;
          prices_include_tax?: boolean;
          shipping_method?: string | null;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          checkout_key?: string | null;
        };
        Update: {
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          razorpay_order_id?: string | null;
          shipping_address?: Json | null;
          paid_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: Timestamps & {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          colour_name: string | null;
          product_name: string;
          product_slug: string | null;
          image_url: string | null;
          unit_price_cents: number;
          quantity: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          colour_name?: string | null;
          product_name: string;
          product_slug?: string | null;
          image_url?: string | null;
          unit_price_cents: number;
          quantity: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: Timestamps & {
          id: string;
          product_id: string;
          user_id: string;
          author_name: string;
          rating: number;
          title: string;
          body: string;
          status: ReviewStatus;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          author_name: string;
          rating: number;
          title?: string;
          body: string;
          status?: ReviewStatus;
        };
        Update: {
          rating?: number;
          title?: string;
          body?: string;
          status?: ReviewStatus;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: Timestamps & { id: string; email: string; source: string };
        Insert: { id?: string; email: string; source?: string };
        Update: { source?: string };
        Relationships: [];
      };
      contact_messages: {
        Row: Timestamps & {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          order_ref: string | null;
          message: string;
          handled: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          order_ref?: string | null;
          message: string;
        };
        Update: { handled?: boolean };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      has_purchased: { Args: { p_product_id: string }; Returns: boolean };
      confirm_order_payment: {
        Args: {
          p_order_id: string;
          p_provider: PaymentProvider;
          p_amount: number;
          p_currency: string;
          p_payment_ref: string;
          p_payment_method: string | null;
        };
        Returns: boolean;
      };
      place_cod_order: { Args: { p_order_id: string }; Returns: boolean };
      mark_cod_collected: { Args: { p_order_id: string }; Returns: boolean };
      hit_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      market: DbMarket;
      payment_status: PaymentStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];

export type Profile = Row<"profiles">;
export type Category = Row<"categories">;
export type Product = Row<"products">;
export type ProductVariant = Row<"product_variants">;
export type ProductImage = Row<"product_images">;
export type CartItemRow = Row<"cart_items">;
export type Order = Row<"orders">;
export type OrderItem = Row<"order_items">;
export type Review = Row<"reviews">;
export type ContactMessage = Row<"contact_messages">;
export type NewsletterSubscriber = Row<"newsletter_subscribers">;

export type VariantSummary = Pick<
  ProductVariant,
  "id" | "colour_name" | "colour_hex" | "colour_family" | "stock" | "sort_order" | "is_active"
>;

/** A product joined with its images, colour variants and (optionally) its category. */
export type ProductWithImages = Product & {
  product_images: Pick<ProductImage, "id" | "url" | "alt" | "sort_order" | "variant_id">[];
  product_variants: VariantSummary[];
  categories?: Pick<Category, "name" | "slug"> | null;
};
