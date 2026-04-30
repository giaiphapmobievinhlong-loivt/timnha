import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { runAllScrapers } from '@/lib/scrapers';

// Vercel Cron gọi endpoint này theo schedule trong vercel.json
// Mỗi 15 phút: */15 * * * *
//
// Vercel tự gắn header: Authorization: Bearer ${CRON_SECRET}
// (CRON_SECRET được set tự động bởi Vercel khi deploy)

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Dev mode: không có secret, cho phép
    return process.env.NODE_ENV === 'development';
  }
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${cronSecret}`;
}

// GET: Vercel Cron gọi
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // waitUntil: trả response ngay, scraping chạy nền (không bị timeout HTTP)
  waitUntil(
    runAllScrapers().catch(err => {
      console.error('[Cron] Scraper error:', err);
    })
  );

  return NextResponse.json({
    status: 'started',
    timestamp: new Date().toISOString(),
    message: 'Scraping started in background',
  });
}

// POST: Gọi thủ công để test (từ dashboard hoặc curl)
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Chạy đồng bộ để trả về kết quả ngay (chỉ dùng khi test)
  try {
    const report = await runAllScrapers();
    return NextResponse.json({ status: 'completed', report });
  } catch (err) {
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
