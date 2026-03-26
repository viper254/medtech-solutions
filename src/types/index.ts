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
  offer_price: number | null;       // limited-time offer price
  offer_expires_at: string | null;  // ISO timestamp — null means no active offer
  stock_quantity: number;
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
  effective_price: number; // price snapshotted at add-time
  price_type: 'offer' | 'discounted' | 'regular'; // what kind of price was applied
  price_max: number | null; // set only for range-priced products
  quantity: number;
  thumbnail_url: string;
}
