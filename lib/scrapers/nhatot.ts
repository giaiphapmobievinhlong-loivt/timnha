import {
  detectMultipleFloors,
  extractDistrict,
  isExcludedDistrict,
  getNearbySchools,
  isWithinOneWeek,
} from '../filters';
import { MAX_PRICE } from '../constants';
import type { ListingInsert, ScraperResult } from '../types';

interface ChothotImage {
  name: string;
}

interface ChothotParam {
  label: string;
  value: string;
  name: string;
}

interface ChothotAd {
  list_id: number;
  subject: string;
  price: number;
  area: number;
  address: string;
  area_name: string;    // tên quận/huyện
  ward_name?: string;
  date: number;         // Unix timestamp (giây)
  images?: ChothotImage[];
  params?: ChothotParam[];
  body?: string;
}

interface ChothotResponse {
  total: number;
  ads: ChothotAd[];
}

// Chotot lưu ảnh theo dạng UUID, build full URL
function buildImageUrl(name: string): string {
  if (!name) return '';
  if (name.startsWith('http')) return name;
  // Thử cả hai format phổ biến của chotot
  return `https://static.chotot.com/storage/chotot-kinhnghiem/pt/ad/${name}`;
}

export async function scrapeNhatot(): Promise<ScraperResult> {
  const allListings: ListingInsert[] = [];
  const PAGES = 4; // 4 trang × 40 = 160 listings mỗi lần scrape

  try {
    for (let page = 0; page < PAGES; page++) {
      const params = new URLSearchParams({
        region_v2: '13000',   // TP. Hồ Chí Minh
        cg: '2010',           // Cho thuê nhà
        price_max: String(MAX_PRICE),
        price_min: '500000',
        o: String(page * 40),
        limit: '40',
        st: 'u,s',            // user và shop listings
        key_param_included: 'true',
      });

      const res = await fetch(
        `https://gateway.chotot.com/v1/public/ad-listing?${params}`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'application/json',
            'Accept-Language': 'vi-VN,vi;q=0.9',
          },
          signal: AbortSignal.timeout(12_000),
        }
      );

      if (!res.ok) {
        if (page === 0) throw new Error(`HTTP ${res.status}`);
        break; // Trang sau không còn data, dừng lại
      }

      const data: ChothotResponse = await res.json();
      if (!data.ads?.length) break;

      for (const ad of data.ads) {
        // Bỏ qua listing không hợp lệ
        if (!ad.subject || ad.price <= 0 || ad.price > MAX_PRICE) continue;

        const postedAt = new Date(ad.date * 1000);
        if (!isWithinOneWeek(postedAt)) continue;

        const district = ad.area_name || extractDistrict(ad.address || '');
        if (isExcludedDistrict(district)) continue;

        const description = ad.body || '';
        const floorParam = ad.params?.find(p =>
          p.name === 'so_lau' || p.label?.toLowerCase().includes('lầu') || p.label?.toLowerCase().includes('tầng')
        );
        const floorCount = floorParam ? parseInt(floorParam.value) : undefined;

        // Kiểm tra nhà có ít nhất 1 trệt + 1 lầu
        const hasMultiFloor =
          (floorCount !== undefined && floorCount >= 1) ||
          detectMultipleFloors(ad.subject, description);

        if (!hasMultiFloor) continue;

        const images = (ad.images || [])
          .map(img => buildImageUrl(img.name))
          .filter(Boolean)
          .slice(0, 6);

        allListings.push({
          source: 'nhatot',
          external_id: String(ad.list_id),
          title: ad.subject.trim(),
          price: ad.price,
          address: ad.address || null,
          district: district || null,
          url: `https://www.nhatot.com/mua-ban-bat-dong-san/${ad.list_id}.htm`,
          images,
          description: description || null,
          area: ad.area || null,
          has_multiple_floors: true,
          nearby_schools: getNearbySchools(district),
          posted_at: postedAt.toISOString(),
          is_active: true,
        });
      }
    }

    return { listings: allListings };
  } catch (err) {
    return { listings: allListings, error: String(err) };
  }
}
