
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!) 
  : null;

/**
 * SQL Schema for Reference:
 * 
 * CREATE TABLE public.categories (
 *   id uuid not null default extensions.uuid_generate_v4 (),
 *   name text not null,
 *   constraint categories_pkey primary key (id)
 * ) TABLESPACE pg_default;
 * 
 * CREATE TABLE public.products (
 *   id uuid not null default extensions.uuid_generate_v4 (),
 *   name text not null,
 *   sku text not null,
 *   category text not null,
 *   price numeric not null,
 *   cost numeric not null,
 *   stock integer not null default 0,
 *   min_stock integer not null default 10,
 *   expiry_date date null,
 *   constraint products_pkey primary key (id),
 *   constraint products_sku_key unique (sku)
 * ) TABLESPACE pg_default;
 * 
 * CREATE TABLE public.entities (
 *   id uuid not null default extensions.uuid_generate_v4 (),
 *   name text not null,
 *   type text not null,
 *   email text null,
 *   phone text null,
 *   address text null,
 *   constraint entities_pkey primary key (id)
 * ) TABLESPACE pg_default;
 * 
 * CREATE TABLE public.invoices (
 *   id uuid not null default extensions.uuid_generate_v4 (),
 *   number text not null,
 *   date timestamp with time zone null default now(),
 *   type text not null,
 *   entity_id uuid null,
 *   entity_name text not null,
 *   subtotal numeric not null,
 *   total numeric not null,
 *   status text null default 'paid'::text,
 *   paid_amount numeric null default 0,
 *   constraint invoices_pkey primary key (id),
 *   constraint invoices_number_key unique (number),
 *   constraint invoices_entity_id_fkey foreign KEY (entity_id) references entities (id)
 * ) TABLESPACE pg_default;
 * 
 * CREATE TABLE public.invoice_items (
 *   id uuid not null default extensions.uuid_generate_v4 (),
 *   invoice_id uuid null,
 *   product_id uuid null,
 *   product_name text not null,
 *   quantity integer not null,
 *   unit_price numeric not null,
 *   total numeric not null,
 *   cost numeric null,
 *   constraint invoice_items_pkey primary key (id),
 *   constraint invoice_items_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
 *   constraint invoice_items_product_id_fkey foreign KEY (product_id) references products (id)
 * ) TABLESPACE pg_default;
 * 
 * CREATE TABLE cash_transactions (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   date TIMESTAMPTZ DEFAULT now(),
 *   description TEXT NOT NULL,
 *   amount NUMERIC NOT NULL,
 *   type TEXT NOT NULL, -- 'income' or 'expense'
 *   category TEXT NOT NULL
 * );
 */
