import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-debug-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Test Supabase connection
  try {
    const db = getAdminClient();
    const { data, error, count } = await db
      .from('listings')
      .select('id', { count: 'exact', head: true });
    results.supabase = error
      ? { error: error.message, code: error.code }
      : { ok: true, count };
  } catch (e) {
    results.supabase = { error: String(e) };
  }

  // 2. Test phongtro123 HTTP
  try {
    const res = await fetch('https://phongtro123.com/tp-ho-chi-minh/nha-nguyen-can', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
      signal: AbortSignal.timeout(10000),
    });
    const text = await res.text();
    const listingCount = (text.match(/pr\d+\.html/g) || []).length;
    results.phongtro123 = { status: res.status, htmlLen: text.length, listingLinks: listingCount };
  } catch (e) {
    results.phongtro123 = { error: String(e) };
  }

  // 3. Test Chotot API
  try {
    const res = await fetch(
      'https://gateway.chotot.com/v1/public/ad-listing?region_v2=13000&cg=1020&o=0&limit=10&st=u,s',
      {
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      }
    );
    const data = await res.json();
    const under5m = (data.ads || []).filter((a: { price: number }) => a.price > 0 && a.price <= 5_000_000);
    results.chotot = { status: res.status, total: data.total, adsReturned: data.ads?.length, under5m: under5m.length };
  } catch (e) {
    results.chotot = { error: String(e) };
  }

  return NextResponse.json(results);
}
