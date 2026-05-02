import { EXCLUDED_DISTRICT_KEYWORDS, SCHOOLS_BY_DISTRICT } from './constants';

// Keyword patterns chỉ ra nhà có nhiều tầng
const MULTI_FLOOR_PATTERNS = [
  /\d+\s*trệt\s*\d*\s*lầu/i,
  /trệt\s*[+,&\/]\s*\d*\s*lầu/i,
  /trệt\s*lầu/i,
  /\d+\s*lầu/i,
  /\d+\s*tầng/i,
  /nhà\s*lầu/i,
  /có\s*gác/i,
  /trệt\s*gác/i,
  /gác\s*lửng/i,
  /nhà\s*2\s*tầng/i,
  /nhà\s*3\s*tầng/i,
  /nhà\s*4\s*tầng/i,
  /nhà\s*5\s*tầng/i,
  /lầu\s*\d+/i,
  /2\s*tầng/i,
  /3\s*tầng/i,
];

// Từ khóa chỉ nhà 1 tầng / phòng đơn
const SINGLE_FLOOR_PATTERNS = [
  /^phòng\s*trọ/i,
  /căn\s*hộ\s*dịch\s*vụ/i,
  /studio/i,
  /mini/i,
];

export function detectMultipleFloors(title: string, description = ''): boolean {
  const text = `${title} ${description}`;

  // Loại phòng đơn
  if (SINGLE_FLOOR_PATTERNS.some(p => p.test(title))) return false;

  return MULTI_FLOOR_PATTERNS.some(p => p.test(text));
}

// Chuẩn hóa string để so sánh không dấu
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isExcludedDistrict(district: string): boolean {
  if (!district) return false;
  const norm = normalize(district);
  return EXCLUDED_DISTRICT_KEYWORDS.some(keyword => norm.includes(normalize(keyword)));
}

// Trích xuất tên quận/huyện từ địa chỉ
export function extractDistrict(address: string): string {
  if (!address) return '';

  // Tách theo dấu phẩy, lấy từ cuối
  const parts = address.split(',').map(p => p.trim()).filter(Boolean);

  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    if (
      /quận\s*\d+/i.test(part) ||
      /q\.\s*\d+/i.test(part) ||
      /bình\s*thạnh/i.test(part) ||
      /tân\s*bình/i.test(part) ||
      /tân\s*phú/i.test(part) ||
      /gò\s*vấp/i.test(part) ||
      /phú\s*nhuận/i.test(part) ||
      /bình\s*chánh/i.test(part) ||
      /hóc\s*môn/i.test(part) ||
      /củ\s*chi/i.test(part) ||
      /nhà\s*bè/i.test(part) ||
      /cần\s*giờ/i.test(part) ||
      /huyện/i.test(part)
    ) {
      // Chuẩn hóa tên quận
      const match = part.match(/quận\s*(\d+)/i) || part.match(/q\.?\s*(\d+)/i);
      if (match) return `Quận ${match[1]}`;
      return part.replace(/^(quận|huyện|tp\.?)\s*/i, '').trim();
    }
  }

  // Fallback: lấy phần tử áp chót
  return parts[parts.length - 2] || parts[parts.length - 1] || '';
}

export function getNearbySchools(district: string): string[] {
  if (!district) return [];
  const normDistrict = normalize(district);

  for (const [key, schools] of Object.entries(SCHOOLS_BY_DISTRICT)) {
    if (normDistrict.includes(normalize(key)) || normalize(key).includes(normDistrict)) {
      return schools;
    }
  }
  return [];
}

export function isWithinOneWeek(date: Date): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return date >= oneWeekAgo && date <= new Date();
}

export function parsePrice(text: string): number {
  const t = text.toLowerCase().replace(/\s/g, '');

  if (t.includes('triệu') || t.includes('trieu') || t.includes('tr/')) {
    const num = parseFloat(t.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (!isNaN(num)) return Math.round(num * 1_000_000);
  }

  const num = parseInt(t.replace(/[^0-9]/g, ''));
  return isNaN(num) ? 0 : num;
}

// Parse ngày đăng từ text tiếng Việt: "3 giờ trước", "2 ngày trước", "30/04/2024"
export function parsePostedDate(text: string): Date {
  const now = new Date();
  const t = text.toLowerCase().trim();

  const hourMatch = t.match(/(\d+)\s*giờ/);
  if (hourMatch) {
    const d = new Date(now);
    d.setHours(d.getHours() - parseInt(hourMatch[1]));
    return d;
  }

  const minuteMatch = t.match(/(\d+)\s*phút/);
  if (minuteMatch) {
    const d = new Date(now);
    d.setMinutes(d.getMinutes() - parseInt(minuteMatch[1]));
    return d;
  }

  const dayMatch = t.match(/(\d+)\s*ngày/);
  if (dayMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(dayMatch[1]));
    return d;
  }

  const weekMatch = t.match(/(\d+)\s*tuần/);
  if (weekMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(weekMatch[1]) * 7);
    return d;
  }

  // dd/mm/yyyy
  const dateMatch = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    return new Date(
      parseInt(dateMatch[3]),
      parseInt(dateMatch[2]) - 1,
      parseInt(dateMatch[1])
    );
  }

  // yyyy-mm-dd
  const isoMatch = t.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return new Date(t);

  return now;
}
