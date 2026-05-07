import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  detectMultipleFloors,
  extractDistrict,
  isExcludedDistrict,
  getNearbySchools,
  isWithinOneWeek,
} from '../filters';
import type { ListingInsert, ScraperResult } from '../types';

const BASE_URL = 'https://alonhadat.com.vn';

// gia=1: <1M, 2: 1-3M, 3: 3-5M, 4: 5-10M, 5: 10-15M, 6: 15-20M
const PRICE_TIERS = [1, 2, 3, 4, 5, 6];
const PAGES_PER_TIER = 3;

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
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseItem(
  $: cheerio.CheerioAPI,
  el: AnyNode,
  seen: Set<string>
): ListingInsert | null {
  const item = $(el);

  // URL + external ID
  const href = item.find('a[itemprop="url"]').attr('href') || '';
  const idMatch = href.match(/(\d+)\.html$/);
  if (!idMatch) return null;
  const externalId = idMatch[1];
  if (seen.has(externalId)) return null;

  // Title
  const title = item.find('h3.property-title').text().trim();
  if (!title || title.length < 5) return null;

  // Date: <time datetime="2026-05-02">
  const dateStr = item.find('time.created-date').attr('datetime') || '';
  const postedAt = dateStr ? new Date(dateStr) : new Date();
  if (dateStr && !isWithinOneWeek(postedAt)) return null;

  // Price: <span itemprop="price" content="9000000">
  const priceContent = item.find('span[itemprop="price"]').attr('content') || '0';
  const price = parseInt(priceContent, 10);
  if (price <= 0 || price > 20_000_000) return null;

  // Description (brief paragraph)
  const description = item.find('p.brief').text().trim() || null;

  // Floor check
  if (!detectMultipleFloors(title, description || '')) return null;

  // Area
  const areaText = item.find('span.area span[itemprop="value"]').first().text().trim();
  const area = areaText ? parseFloat(areaText) : null;

  // Address from old-address (has quận/huyện info)
  const addressText = item.find('p.old-address span').text().trim().replace(/\(cũ\)/g, '').trim();
  const district = extractDistrict(addressText) || extractDistrict(title);
  if (isExcludedDistrict(district)) return null;

  // Image
  const imgSrc = item.find('div.thumbnail img').attr('src') || '';
  const images = imgSrc ? [`${BASE_URL}${imgSrc}`] : [];

  return {
    source: 'alonhadat',
    external_id: externalId,
    title,
    price,
    address: addressText || null,
    district: district || null,
    url: `${BASE_URL}${href}`,
    images,
    description,
    area,
    has_multiple_floors: true,
    nearby_schools: getNearbySchools(district),
    posted_at: postedAt.toISOString(),
    is_active: true,
  };
}

export async function scrapeAlonhadat(): Promise<ScraperResult> {
  const allListings: ListingInsert[] = [];
  const seen = new Set<string>();

  try {
    for (const tier of PRICE_TIERS) {
      for (let page = 1; page <= PAGES_PER_TIER; page++) {
        const pageSegment = page === 1 ? '' : `/trang-${page}`;
        const url = `${BASE_URL}/cho-thue-nha/ho-chi-minh${pageSegment}?dt=0&gia=${tier}&huong=0`;

        const html = await fetchPage(url);
        if (!html) break;

        const $ = cheerio.load(html);
        const items = $('article.property-item');
        if (!items.length) break;

        items.each((_: number, el: AnyNode) => {
          const listing = parseItem($, el, seen);
          if (listing) {
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
