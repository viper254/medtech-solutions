export interface MediaItem {
  id: string;
  product_id: string;
  url: string; // Supabase Storage public URL
  type: 'image' | 'video';
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'Phones' | 'Laptops' | 'Desktops' | 'Accessories' | 'Medical Equipment';
  description: string;
  original_price: number;
  discounted_price: number | null;
  price_max: number | null;
  offer_price: number | null;
  offer_expires_at: string | null;
  stock_quantity: number;
  is_featured: boolean;
  low_stock_threshold: number;
  media: MediaItem[];
  created_at: string;
  updated_at: string;
}

export interface RepairService {
  id: string;
  name: string;
  description: string;
  estimated_turnaround: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  effective_price: number;
  price_type: 'offer' | 'discounted' | 'regular';
  price_max: number | null;
  quantity: number;
  thumbnail_url: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type OrderChannel = 'whatsapp' | 'mpesa' | 'card' | 'cash';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_category: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  price_type: 'offer' | 'discounted' | 'regular';
}

export interface Order {
  id: string;
  reference: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  channel: OrderChannel;
  payment_status: PaymentStatus;
  payment_method: string | null;
  payment_ref: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface CustomerProfile {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  email?: string; // from auth.users, joined client-side
}
