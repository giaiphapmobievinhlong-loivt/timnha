import { getAdminClient } from '../supabase';
import { scrapeNhatot } from './nhatot';
import { scrapePhongtro123 } from './phongtro123';
import { scrapeMogi } from './mogi';
import type { ListingInsert, ScraperReport } from '../types';

export async function runAllScrapers(): Promise<ScraperReport> {
  const errors: string[] = [];
  const allListings: ListingInsert[] = [];
  const sources: Record<string, number> = {};

  // Chạy tất cả scrapers song song
  const [nhatotRes, phongtro123Res, mogiRes] = await Promise.allSettled([
    scrapeNhatot(),
    scrapePhongtro123(),
    scrapeMogi(),
  ]);

  if (nhatotRes.status === 'fulfilled') {
    if (nhatotRes.value.error) errors.push(`nhatot: ${nhatotRes.value.error}`);
    allListings.push(...nhatotRes.value.listings);
    sources.nhatot = nhatotRes.value.listings.length;
  } else {
    errors.push(`nhatot: ${String(nhatotRes.reason)}`);
    sources.nhatot = 0;
  }

  if (phongtro123Res.status === 'fulfilled') {
    if (phongtro123Res.value.error) errors.push(`phongtro123: ${phongtro123Res.value.error}`);
    allListings.push(...phongtro123Res.value.listings);
    sources.phongtro123 = phongtro123Res.value.listings.length;
  } else {
    errors.push(`phongtro123: ${String(phongtro123Res.reason)}`);
    sources.phongtro123 = 0;
  }

  if (mogiRes.status === 'fulfilled') {
    if (mogiRes.value.error) errors.push(`mogi: ${mogiRes.value.error}`);
    allListings.push(...mogiRes.value.listings);
    sources.mogi = mogiRes.value.listings.length;
  } else {
    errors.push(`mogi: ${String(mogiRes.reason)}`);
    sources.mogi = 0;
  }

  let inserted = 0;

  if (allListings.length > 0) {
    const db = getAdminClient();

    // Upsert: cập nhật nếu đã có, thêm mới nếu chưa có
    const { data, error } = await db
      .from('listings')
      .upsert(allListings, {
        onConflict: 'source,external_id',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      errors.push(`DB upsert: ${error.message}`);
    } else {
      inserted = data?.length || 0;
    }

    // Đánh dấu listing cũ hơn 7 ngày là inactive
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    await db
      .from('listings')
      .update({ is_active: false })
      .lt('posted_at', oneWeekAgo.toISOString())
      .eq('is_active', true);
  }

  console.log(`[Scraper] Done: ${allListings.length} found, ${inserted} upserted`, {
    sources,
    errors,
  });

  return { total: allListings.length, inserted, errors, sources };
}
