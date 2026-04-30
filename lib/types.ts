export type Source = 'nhatot' | 'phongtro123' | 'batdongsan';

export interface Listing {
  id: string;
  source: Source;
  external_id: string;
  title: string;
  price: number;
  address: string | null;
  district: string | null;
  url: string;
  images: string[];
  description: string | null;
  area: number | null;
  has_multiple_floors: boolean;
  nearby_schools: string[];
  posted_at: string;
  scraped_at: string;
  is_active: boolean;
}

export type ListingInsert = Omit<Listing, 'id' | 'scraped_at'>;

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ScraperResult {
  listings: ListingInsert[];
  error?: string;
}

export interface ScraperReport {
  total: number;
  inserted: number;
  errors: string[];
  sources: Record<string, number>;
}

export interface FilterState {
  district: string;
  maxPrice: number;
  multiFloor: boolean;
  source: string;
}
