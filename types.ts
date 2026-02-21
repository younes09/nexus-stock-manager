export type EntityType = 'client' | 'supplier';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number; // Selling price
  cost: number;  // Purchase price
  stock: number;
  minStock: number;
  expiryDate?: string; // ISO date string
}

export interface Category {
  id: string;
  name: string;
}

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  cost: number;
  total: number;
}

export type InvoiceType = 'sale' | 'purchase';

export interface Invoice {
  id: string;
  number: string;
  date: string;
  type: InvoiceType;
  entityId: string;
  entityName: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  paidAmount: number;
  status: 'draft' | 'paid' | 'pending';
}

export interface CashTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number | null;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface AppState {
  products: Product[];
  entities: Entity[];
  invoices: PaginatedResponse<Invoice>;
  categories: Category[];
  cashTransactions: PaginatedResponse<CashTransaction>;
  user: User | null;
}