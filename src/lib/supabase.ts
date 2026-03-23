import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TVBoxOrder {
  id?: string;
  created_at?: string;
  product_name: string;
  price: string;
  amount: number;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  payment_reference: string;
  payment_status: 'pending' | 'paid' | 'failed';
  notified: boolean;
}
