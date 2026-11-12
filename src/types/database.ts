/**
 * Database types for the Supabase client, matching supabase/01_schema.sql.
 *
 * Hand-written in the same shape the Supabase CLI generates. If you change the
 * schema you can regenerate them with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UserRole = "customer" | "admin";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamps = { created_at: string };

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
        Row: Timestamps & {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          price_cents: number;
          stock: number;
          is_active: boolean;
          is_featured: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          price_cents: number;
          stock?: number;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          slug?: string;
          description?: string;
          price_cents?: number;
          stock?: number;
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
      product_images: {
        Row: Timestamps & {
          id: string;
          product_id: string;
          url: string;
          alt: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
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
        ];
      };
      cart_items: {
        Row: Timestamps & {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
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
          total_cents: number;
          currency: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          shipping_address: Json | null;
          paid_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          status?: OrderStatus;
          subtotal_cents: number;
          shipping_cents?: number;
          total_cents: number;
          currency?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          shipping_address?: Json | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
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
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      mark_order_paid: {
        Args: {
          p_order_id: string;
          p_session_id: string;
          p_payment_intent: string | null;
          p_shipping: Json | null;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];

export type Profile = Row<"profiles">;
export type Category = Row<"categories">;
export type Product = Row<"products">;
export type ProductImage = Row<"product_images">;
export type CartItemRow = Row<"cart_items">;
export type Order = Row<"orders">;
export type OrderItem = Row<"order_items">;

/** A product joined with its images (and optionally its category). */
export type ProductWithImages = Product & {
  product_images: Pick<ProductImage, "id" | "url" | "alt" | "sort_order">[];
  categories?: Pick<Category, "name" | "slug"> | null;
};
