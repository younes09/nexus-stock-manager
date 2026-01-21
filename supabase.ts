
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
 * CREATE TABLE categories (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   name TEXT NOT NULL
 * );
 * 
 * CREATE TABLE products (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   name TEXT NOT NULL,
 *   sku TEXT UNIQUE NOT NULL,
 *   category TEXT NOT NULL,
 *   price NUMERIC NOT NULL,
 *   cost NUMERIC NOT NULL,
 *   stock INT NOT NULL DEFAULT 0,
 *   min_stock INT NOT NULL DEFAULT 10,
 *   expiry_date DATE
 * );
 * 
 * CREATE TABLE entities (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   name TEXT NOT NULL,
 *   type TEXT NOT NULL, -- 'client' or 'supplier'
 *   email TEXT,
 *   phone TEXT,
 *   address TEXT
 * );
 * 
 * CREATE TABLE invoices (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   number TEXT UNIQUE NOT NULL,
 *   date TIMESTAMPTZ DEFAULT now(),
 *   type TEXT NOT NULL, -- 'sale' or 'purchase'
 *   entity_id UUID REFERENCES entities(id),
 *   entity_name TEXT NOT NULL,
 *   subtotal NUMERIC NOT NULL,
 *   total NUMERIC NOT NULL,
 *   status TEXT DEFAULT 'paid'
 * );
 * 
 * CREATE TABLE invoice_items (
 *   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
 *   invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
 *   product_id UUID REFERENCES products(id),
 *   product_name TEXT NOT NULL,
 *   quantity INT NOT NULL,
 *   unit_price NUMERIC NOT NULL,
 *   cost NUMERIC NOT NULL,
 *   total NUMERIC NOT NULL
 * );
 */
