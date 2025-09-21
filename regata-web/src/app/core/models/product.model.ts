export interface Product {
  id: string;
  sku: string;
  brand: string;
  modelName: string;
  size: string;
  price: number;
  stock?: number;
  active: boolean;
  // optional details (from ProductDetailDto)
  tire?: { type?: string | null; loadIndex?: string | null; speedRating?: string | null } | null;
  rim?: { diameterIn?: number | null; widthIn?: number | null; boltPattern?: string | null; offsetMm?: number | null; centerBoreMm?: number | null; material?: string | null; finish?: string | null } | null;
  brandLogoUrl?: string | null;
  images?: string[];
  category?: string | null;
}
