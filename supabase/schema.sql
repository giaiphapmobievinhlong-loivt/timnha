-- ============================================================
-- Schema cho dự án Tìm Nhà Trọ HCM
-- Chạy script này trong Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS listings (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  source      TEXT        NOT NULL,           -- 'nhatot' | 'phongtro123' | 'batdongsan'
  external_id TEXT        NOT NULL,           -- ID từ nguồn gốc
  title       TEXT        NOT NULL,
  price       BIGINT      NOT NULL,           -- VND/tháng
  address     TEXT,
  district    TEXT,
  url         TEXT        NOT NULL,
  images      TEXT[]      DEFAULT '{}',
  description TEXT,
  area        FLOAT,                          -- m²
  has_multiple_floors  BOOLEAN  DEFAULT FALSE,
  nearby_schools       TEXT[]   DEFAULT '{}',
  posted_at   TIMESTAMPTZ NOT NULL,
  scraped_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN     DEFAULT TRUE,

  UNIQUE (source, external_id)
);

-- Indexes để query nhanh
CREATE INDEX IF NOT EXISTS idx_listings_active_price
  ON listings (price)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_active_district
  ON listings (district)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_active_posted
  ON listings (posted_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_floors
  ON listings (has_multiple_floors)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_listings_source
  ON listings (source)
  WHERE is_active = TRUE;

-- ============================================================
-- Row Level Security (RLS)
-- Cho phép public đọc, chỉ service_role mới ghi
-- ============================================================
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Ai cũng có thể đọc listing còn active
CREATE POLICY "Public read active listings"
  ON listings FOR SELECT
  USING (is_active = TRUE);

-- Chỉ backend (service_role key) mới được insert/update/delete
-- (Khi dùng supabase admin client với service_role key, RLS bị bypass tự động)

-- ============================================================
-- Function: tự động set scraped_at khi upsert
-- ============================================================
CREATE OR REPLACE FUNCTION update_scraped_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.scraped_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_scraped_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_scraped_at();
