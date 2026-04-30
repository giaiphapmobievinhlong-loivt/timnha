import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [totalRes, sourceRes, latestRes] = await Promise.all([
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('has_multiple_floors', true)
      .lte('price', 5_000_000),

    supabase
      .from('listings')
      .select('source')
      .eq('is_active', true)
      .eq('has_multiple_floors', true)
      .lte('price', 5_000_000),

    supabase
      .from('listings')
      .select('scraped_at')
      .eq('is_active', true)
      .order('scraped_at', { ascending: false })
      .limit(1),
  ]);

  // Đếm theo nguồn
  const sourceCounts: Record<string, number> = {};
  if (sourceRes.data) {
    for (const row of sourceRes.data) {
      sourceCounts[row.source] = (sourceCounts[row.source] || 0) + 1;
    }
  }

  return NextResponse.json({
    total: totalRes.count || 0,
    sources: sourceCounts,
    lastScraped: latestRes.data?.[0]?.scraped_at || null,
  });
}
