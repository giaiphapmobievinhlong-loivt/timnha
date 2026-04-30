import * as cheerio from 'cheerio';
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

const BASE_URL = 'https://mogi.vn';
const PAGES = 3;

export async function scrapeMogi(): Promise<ScraperResult> {
  const allListings: ListingInsert[] = [];
  const seen = new Set<string>();

  try {
    for (let page = 1; page <= PAGES; page++) {
      const url =
        page === 1
          ? `${BASE_URL}/thue-nha-rieng/tp-ho-chi-minh?price-max=5`
          : `${BASE_URL}/thue-nha-rieng/tp-ho-chi-minh/p${page}?price-max=5`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'vi-VN,vi;q=0.9',
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!res.ok) break;

      const html = await res.text();
      const $ = cheerio.load(html);

      const items = $('div.item, .property-item, article[class*="item"]');
      if (items.length === 0) break;

      items.each((_, el) => {
        try {
          const item = $(el);

          const linkEl = item.find('a.title, h2 a, h3 a, .name a').first();
          const title = linkEl.text().trim();
          if (!title || title.length < 5) return;

          const href = linkEl.attr('href') || '';
          if (!href) return;

          const url = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          const externalId = href.split('/').filter(Boolean).pop() || '';
          if (!externalId || seen.has(externalId)) return;

          const priceText = item.find('.price, .gia, [class*="price"]').first().text().trim();
          const price = parsePrice(priceText);
          if (price <= 0 || price > MAX_PRICE) return;

          const addressText = item
            .find('.location, .address, [class*="location"]')
            .first()
            .text()
            .trim();
          const district = extractDistrict(addressText) || extractDistrict(title);
          if (isExcludedDistrict(district)) return;

          const dateText = item
            .find('.time, .date, [class*="time"], [class*="date"]')
            .first()
            .text()
            .trim();
          const postedAt = parsePostedDate(dateText);
          if (!isWithinOneWeek(postedAt)) return;

          const description = item
            .find('.description, .desc, [class*="desc"]')
            .first()
            .text()
            .trim();
          if (!detectMultipleFloors(title, description)) return;

          const areaText = item.find('.area, [class*="area"]').first().text().trim();
          const area = parseFloat(areaText.replace(/[^0-9.]/g, '')) || null;

          const images: string[] = [];
          item.find('img[src], img[data-src]').each((_, img) => {
            const src = $(img).attr('data-src') || $(img).attr('src') || '';
            if (src && src.startsWith('http') && !src.includes('placeholder')) {
              images.push(src);
            }
          });

          seen.add(externalId);
          allListings.push({
            source: 'batdongsan', // reuse source slot
            external_id: `mogi_${externalId}`,
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
          });
        } catch {
          // skip
        }
      });
    }

    return { listings: allListings };
  } catch (err) {
    return { listings: allListings, error: String(err) };
  }
}
