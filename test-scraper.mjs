import * as cheerio from 'cheerio';

const BASE_URL = 'https://phongtro123.com';

const res = await fetch(`${BASE_URL}/tp-ho-chi-minh/nha-nguyen-can`, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    Accept: 'text/html',
    'Accept-Language': 'vi-VN,vi;q=0.9',
  },
});

const html = await res.text();
const $ = cheerio.load(html);

// Test selector
const links = $('a[title]').filter((_, el) => {
  const href = $(el).attr('href') || '';
  return href.endsWith('.html') && /pr\d+/.test(href);
});

console.log('Total listing links:', links.length);

const FLOOR_PATTERNS = [
  /\d+\s*trệt\s*\d*\s*lầu/i, /trệt\s*[+,&\/]\s*\d*\s*lầu/i, /trệt\s*lầu/i,
  /\d+\s*lầu/i, /\d+\s*tầng/i, /nhà\s*lầu/i, /có\s*gác/i, /gác\s*lửng/i,
  /2\s*tầng/i, /3\s*tầng/i, /lầu\s*\d+/i,
];

let matched = 0;
let under5m = 0;

links.each((_, el) => {
  const item = $(el);
  const title = item.attr('title') || '';
  const href = item.attr('href') || '';
  const priceText = item.find('.text-green').first().text().trim();
  const district = item.find('.fs-7').first().text().trim();

  // Parse price
  const t = priceText.toLowerCase().replace(/\s/g, '');
  let price = 0;
  if (t.includes('triệu') || t.includes('tr')) {
    const num = parseFloat(t.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) price = Math.round(num * 1_000_000);
  }

  const hasFloor = FLOOR_PATTERNS.some(p => p.test(title));

  if (price > 0 && price <= 5_000_000) under5m++;
  if (price > 0 && price <= 5_000_000 && hasFloor) {
    matched++;
    console.log(`MATCH: ${title.substring(0, 60)}`);
    console.log(`  price=${price.toLocaleString()} | district=${district} | href=${href}`);
  }
});

console.log(`\nTotal: ${links.length} | Under 5M: ${under5m} | Has floors: ${matched}`);

// Show sample of under-5M titles
console.log('\n--- Sample under 5M titles (no floor filter) ---');
let count = 0;
links.each((_, el) => {
  if (count >= 10) return;
  const item = $(el);
  const title = item.attr('title') || '';
  const priceText = item.find('.text-green').first().text().trim();
  const t = priceText.toLowerCase().replace(/\s/g, '');
  let price = 0;
  if (t.includes('triệu') || t.includes('tr')) {
    const num = parseFloat(t.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) price = Math.round(num * 1_000_000);
  }
  if (price > 0 && price <= 5_000_000) {
    console.log(`  ${priceText.padEnd(20)} | ${title.substring(0, 60)}`);
    count++;
  }
});
