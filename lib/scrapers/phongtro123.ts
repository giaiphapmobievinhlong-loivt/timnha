import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  detectMultipleFloors,
  extractDistrict,
  isExcludedDistrict,
  getNearbySchools,
  isWithinOneWeek,
  parsePrice,
  parsePostedDate,
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
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9',
        Referer: BASE_URL,
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseListingFromElement(
  $: cheerio.CheerioAPI,
  el: AnyNode
): ListingInsert | null {
  const item = $(el);

  // Lấy title và URL
  const linkEl = item.find('h3 a, .title a, .post-title a, a.title').first();
  const title = linkEl.text().trim() || item.find('h3').first().text().trim();
  if (!title || title.length < 5) return null;

  const href = linkEl.attr('href') || item.find('a[href*="/thue"], a[href*="/cho-thue"]').first().attr('href') || '';
  const url = href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : '';
  if (!url) return null;

  // Tạo external_id từ URL slug
  const externalId = href.split('/').filter(Boolean).pop() || '';
  if (!externalId) return null;

  // Giá
  const priceText = item
    .find('.price, .gia, [class*="price"], [class*="gia"]')
    .first()
    .text()
    .trim();
  const price = parsePrice(priceText);
  if (price <= 0 || price > MAX_PRICE) return null;

  // Địa chỉ / quận
  const addressText = item
    .find('.location, .address, .dia-chi, [class*="location"], [class*="address"]')
    .first()
    .text()
    .trim();
  const district = extractDistrict(addressText) || extractDistrict(title);
  if (isExcludedDistrict(district)) return null;

  // Ngày đăng
  const dateText = item
    .find('.time, .date, .ngay, [class*="time"], [class*="date"]')
    .first()
    .text()
    .trim();
  const postedAt = parsePostedDate(dateText);
  if (!isWithinOneWeek(postedAt)) return null;

  // Mô tả
  const description = item
    .find('.description, .content, .mo-ta, [class*="desc"]')
    .first()
    .text()
    .trim();

  // Kiểm tra nhà có nhiều tầng
  if (!detectMultipleFloors(title, description)) return null;

  // Diện tích
  const areaText = item
    .find('.area, .dien-tich, [class*="area"]')
    .first()
    .text()
    .trim();
  const area = parseFloat(areaText.replace(/[^0-9.]/g, '')) || null;

  // Ảnh
  const images: string[] = [];
  item.find('img[src], img[data-src], img[data-lazy]').each((_, img) => {
    const src =
      $(img).attr('data-lazy') ||
      $(img).attr('data-src') ||
      $(img).attr('src') ||
      '';
    if (
      src &&
      !src.includes('placeholder') &&
      !src.includes('no-image') &&
      !src.includes('data:image') &&
      src.length > 10
    ) {
      images.push(src.startsWith('http') ? src : `${BASE_URL}${src}`);
    }
  });

  return {
    source: 'phongtro123',
    external_id: externalId,
    title,
    price,
    address: addressText || null,
    district: district || null,
    url,
    images: images.slice(0, 6),
    description: description || null,
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

  try {
    // Scrape nhà nguyên căn (whole house) - phù hợp nhất với yêu cầu
    const urlPaths = [
      '/tp-ho-chi-minh/nha-nguyen-can',
      '/tp-ho-chi-minh/nha-tro',
    ];

    for (const path of urlPaths) {
      for (let page = 1; page <= PAGES; page++) {
        const url = `${BASE_URL}${path}?page=${page}`;
        const html = await fetchPage(url);
        if (!html) break;

        const $ = cheerio.load(html);

        // phongtro123 dùng class .post-item hoặc .for-item
        const items = $('[class*="post-item"], [class*="for-item"], .item, article.item');
        if (items.length === 0) break;

        items.each((_, el) => {
          const listing = parseListingFromElement($, el);
          if (listing && !seen.has(listing.external_id)) {
            seen.add(listing.external_id);
            allListings.push(listing);
          }
        });
      }
    }

    return { listings: allListings };
  } catch (err) {
    return { listings: allListings, error: String(err) };
  }
}
