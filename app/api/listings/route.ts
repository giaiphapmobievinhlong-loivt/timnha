import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase';

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Math.max(0, parseInt(searchParams.get('page') || '0'));
  const maxPrice = Math.min(
    parseInt(searchParams.get('maxPrice') || '5000000'),
    5_000_000
  );
  const district = searchParams.get('district') || '';
  const source = searchParams.get('source') || '';
  const multiFloor = searchParams.get('multiFloor') !== 'false';
  const minArea = parseInt(searchParams.get('minArea') || '0');

  const supabase = getAdminClient();
  let query = supabase
    .from('listings')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .gt('price', 0)
    .lte('price', maxPrice)
    .order('posted_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

  if (multiFloor) {
    query = query.eq('has_multiple_floors', true);
  }

  if (district && district !== 'all') {
    query = query.ilike('district', `%${district}%`);
  }

  if (source && source !== 'all') {
    query = query.eq('source', source);
  }

  if (minArea > 0) {
    query = query.gte('area', minArea);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      listings: data || [],
      total: count || 0,
      page,
      limit: PAGE_SIZE,
      hasMore: (count || 0) > (page + 1) * PAGE_SIZE,
    },
    {
      headers: {
        // Cache 5 phút ở CDN, revalidate ngầm
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
