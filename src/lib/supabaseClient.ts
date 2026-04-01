import { createClient } from '@supabase/supabase-js'
import type { Product, MediaItem } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Convert raw DB rows (storage_path) into MediaItem objects with public URLs */
export function mapMediaUrls(rawMedia: Array<Record<string, unknown>>): MediaItem[] {
  return rawMedia.map((m) => ({
    id: m.id as string,
    product_id: m.product_id as string,
    url: supabase.storage.from('product-media').getPublicUrl(m.storage_path as string).data.publicUrl,
    type: m.type as 'image' | 'video',
    sort_order: m.sort_order as number,
  }))
}

/** Convert raw repair_service_media rows into objects with public URLs */
export function mapRepairMedia(rawMedia: Array<Record<string, unknown>>) {
  return rawMedia.map((m) => ({
    id: m.id as string,
    service_id: m.service_id as string,
    storage_path: m.storage_path as string,
    url: supabase.storage.from('product-media').getPublicUrl(m.storage_path as string).data.publicUrl,
    type: m.type as 'image' | 'video',
    sort_order: m.sort_order as number,
  }));
}

/** Attach mapped media URLs to an array of raw product rows */
export function mapProducts(rawProducts: Array<Record<string, unknown>>): Product[] {
  return rawProducts.map((p) => ({
    id: p.id as string,
    name: p.name as string,
    category: p.category as Product['category'],
    description: p.description as string,
    original_price: p.original_price as number,
    discounted_price: (p.discounted_price as number | null) ?? null,
    price_max: (p.price_max as number | null) ?? null,
    offer_price: (p.offer_price as number | null) ?? null,
    offer_expires_at: (p.offer_expires_at as string | null) ?? null,
    stock_quantity: p.stock_quantity as number,
    is_featured: (p.is_featured as boolean) ?? false,
    low_stock_threshold: (p.low_stock_threshold as number) ?? 5,
    created_at: p.created_at as string,
    updated_at: p.updated_at as string,
    media: mapMediaUrls((p.media as Array<Record<string, unknown>>) ?? []),
  }))
}
