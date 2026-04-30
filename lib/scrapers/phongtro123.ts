import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  detectMultipleFloors,
  extractDistrict,
  isExcludedDistrict,
  getNearbySchools,
  parsePrice,
} from '../filters';
import { MAX_PRICE } from '../constants';
import type { ListingInsert, ScraperResult } from '../types';

const BASE_URL = 'https://phongtro123.com';
const PAGES = 3;

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        Referer: BASE_URL,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseListing(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  seen: Set<string>
): ListingInsert | null {
  const item = $(el);

  // Lấy URL và title từ thẻ <a href="..." title="...">
  const href = item.attr('href') || '';
  const title = item.attr('title') || item.find('p.mb-2, p.line-clamp-2').first().text().trim();

  if (!href.endsWith('.html') || !title || title.length < 5) return null;

  // External ID từ slug (vd: cho-thue-nha-pr12345.html → pr12345)
  const slugMatch = href.match(/(pr\d+)\.html$/);
  if (!slugMatch) return null;
  const externalId = slugMatch[1];
  if (seen.has(externalId)) return null;

  const url = `${BASE_URL}${href}`;

  // Giá: class fs-8 fw-semibold text-green
  const priceText = item.find('.text-green').first().text().trim();
  const price = parsePrice(priceText);
  if (price <= 0 || price > MAX_PRICE) return null;

  // Địa chỉ: class text-body fs-7 mt-2
  const addressText = item
    .find('.fs-7')
    .first()
    .text()
    .trim();
  const district = extractDistrict(addressText) || extractDistrict(title);
  if (isExcludedDistrict(district)) return null;

  // Kiểm tra có nhiều tầng
  if (!detectMultipleFloors(title)) return null;

  // Ảnh: img.lazy[data-src]
  const imgSrc =
    item.find('img[data-src]').first().attr('data-src') || '';
  const images = imgSrc ? [imgSrc] : [];

  // Diện tích từ title/description nếu có (vd: "30m2")
  const areaMatch = (title).match(/(\d+)\s*m²?/i);
  const area = areaMatch ? parseFloat(areaMatch[1]) : null;

  // phongtro123 không có date trong list view → dùng thời điểm scrape
  // Listing mới nhất luôn ở trang 1, nên coi như đăng trong 7 ngày qua
  const postedAt = new Date();

  return {
    source: 'phongtro123',
    external_id: externalId,
    title,
    price,
    address: addressText || null,
    district: district || null,
    url,
    images,
    description: null,
    area,
    has_multiple_floors: true,
    nearby_schools: getNearbySchools(district),
    posted_at: postedAt.toISOString(),
    is_active: true,
  };
}

export async function scrapePhongtro123(): Promise<ScraperResult> {
  const allListings: ListingInsert[] = [];
  const seen = new Set<string>();

  // URL cho nhà nguyên căn HCM trên phongtro123
  const paths = [
    '/tp-ho-chi-minh/nha-nguyen-can',
    '/tp-ho-chi-minh/nha-tro',
  ];

  try {
    for (const path of paths) {
      for (let page = 1; page <= PAGES; page++) {
        const url = `${BASE_URL}${path}?page=${page}`;
        const html = await fetchPage(url);
        if (!html) break;

        const $ = cheerio.load(html);

        // Listing items: <a href="/xxx.html" title="...">
        // Lọc chỉ lấy links có slug pr\d+ (listing thực, không phải menu)
        $('a[href$=".html"][title]').each((_: number, el: AnyNode) => {
          const listing = parseListing($, el, seen);
          if (listing) {
            seen.add(listing.external_id);
            allListings.push(listing);
          }
        });

        // Dừng nếu trang này ít hơn 5 listings (đã hết data)
        if (allListings.length < (page - 1) * 5 + 3) break;
      }
    }

    return { listings: allListings };
  } catch (err) {
    return { listings: allListings, error: String(err) };
  }
}
