import {
  detectMultipleFloors,
  extractDistrict,
  isExcludedDistrict,
  getNearbySchools,
  isWithinOneWeek,
} from '../filters';
import { MAX_PRICE } from '../constants';
import type { ListingInsert, ScraperResult } from '../types';

interface ChothotAd {
  list_id: number;
  subject: string;
  price: number;
  area: number;
  body?: string;
  area_name: string;
  ward_name?: string;
  list_time: number;       // Unix timestamp (milliseconds)
  orig_list_time: number;
  images?: string[];       // full CDN URLs
  floors?: number | null;
  house_type?: number;
  params?: { id: string; label: string; value: string }[];
}

interface ChothotResponse {
  total: number;
  ads: ChothotAd[];
}

export async function scrapeNhatot(): Promise<ScraperResult> {
  const allListings: ListingInsert[] = [];
  const PAGES = 5;

  try {
    for (let page = 0; page < PAGES; page++) {
      const params = new URLSearchParams({
        region_v2: '13000',  // TP. Hồ Chí Minh
        cg: '1020',          // Nhà ở (bao gồm cả cho thuê và mua bán)
        o: String(page * 40),
        limit: '40',
        st: 'u,s',
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
          signal: AbortSignal.timeout(15_000),
        }
      );

      if (!res.ok) break;

      const data: ChothotResponse = await res.json();
      if (!data.ads?.length) break;

      for (const ad of data.ads) {
        if (!ad.subject) continue;

        // --- Lọc chỉ lấy tin cho thuê ---
        // Mua bán: giá thường > 500 triệu (500_000_000)
        // Cho thuê: giá thường < 50 triệu/tháng
        if (ad.price > 50_000_000) continue;

        // Giá < 5 triệu/tháng
        if (ad.price <= 0 || ad.price > MAX_PRICE) continue;

        // Ngày đăng từ list_time (milliseconds)
        const postedAt = new Date(ad.list_time);
        if (!isWithinOneWeek(postedAt)) continue;

        // Quận/huyện
        const district = ad.area_name || extractDistrict(ad.body || '');
        if (isExcludedDistrict(district)) continue;

        // Kiểm tra nhà có ít nhất 1 trệt + 1 lầu
        const floorCount = typeof ad.floors === 'number' ? ad.floors : null;
        const description = ad.body || '';
        const hasMultiFloor =
          (floorCount !== null && floorCount >= 2) ||
          detectMultipleFloors(ad.subject, description);
        if (!hasMultiFloor) continue;

        // Images: đã là full URL rồi
        const images = (ad.images || []).filter(Boolean).slice(0, 6);

        allListings.push({
          source: 'nhatot',
          external_id: String(ad.list_id),
          title: ad.subject.trim(),
          price: ad.price,
          address: null,
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
