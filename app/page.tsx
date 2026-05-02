'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import FilterBar from '@/components/FilterBar';
import StatsBar from '@/components/StatsBar';
import ListingGrid from '@/components/ListingGrid';
import type { FilterState, ListingsResponse } from '@/lib/types';

const REFRESH_INTERVAL = 15 * 60; // 15 phút (giây)

const fetcher = (url: string) => fetch(url).then(r => r.json());

function buildListingsUrl(filters: FilterState, page: number): string {
  const params = new URLSearchParams({
    maxPrice: String(filters.maxPrice),
    multiFloor: String(filters.multiFloor),
    page: String(page),
  });
  if (filters.district && filters.district !== 'all') {
    params.set('district', filters.district);
  }
  if (filters.source && filters.source !== 'all') {
    params.set('source', filters.source);
  }
  if (filters.frontage) {
    params.set('frontage', 'true');
  }
  return `/api/listings?${params}`;
}

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>({
    district: 'all',
    maxPrice: 5_000_000,
    multiFloor: true,
    frontage: false,
    source: 'all',
  });
  const [page, setPage] = useState(0);
  const [allListings, setAllListings] = useState<ListingsResponse['listings']>([]);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  // Fetch listings với SWR (auto-refresh mỗi 15 phút)
  const listingsUrl = buildListingsUrl(filters, page);
  const { data, isLoading, mutate } = useSWR<ListingsResponse>(listingsUrl, fetcher, {
    refreshInterval: REFRESH_INTERVAL * 1000,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  // Stats
  const { data: stats } = useSWR('/api/stats', fetcher, {
    refreshInterval: REFRESH_INTERVAL * 1000,
    revalidateOnFocus: false,
  });

  // Reset page + listings khi filter thay đổi
  useEffect(() => {
    setPage(0);
    setAllListings([]);
  }, [filters]);

  // Cộng dồn listings khi load more
  useEffect(() => {
    if (!data?.listings) return;
    if (page === 0) {
      setAllListings(data.listings);
    } else {
      setAllListings(prev => {
        const existingIds = new Set(prev.map(l => `${l.source}-${l.external_id}`));
        const newOnes = data.listings.filter(
          l => !existingIds.has(`${l.source}-${l.external_id}`)
        );
        return [...prev, ...newOnes];
      });
    }
  }, [data, page]);

  // Đếm ngược đến lần refresh tiếp theo
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          mutate();
          return REFRESH_INTERVAL;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [mutate]);

  const handleLoadMore = useCallback(() => {
    setPage(p => p + 1);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                🏠 Tìm Nhà Trọ HCM
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Dưới 7 triệu · Có ít nhất 1 lầu · Toàn TP.HCM · Cập nhật mỗi 15 phút
              </p>
            </div>
            <div className="hidden sm:flex flex-col items-end text-sm text-blue-200">
              <span className="font-semibold text-white text-lg">
                {(data?.total || allListings.length).toLocaleString('vi-VN')} tin
              </span>
              <span>phù hợp điều kiện</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <StatsBar stats={stats} nextRefresh={countdown} />

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        total={data?.total || 0}
        isLoading={isLoading}
      />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Ghi chú điều kiện lọc */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
          <span className="text-base flex-shrink-0">ℹ️</span>
          <span>
            <strong>Điều kiện áp dụng:</strong> Nhà có ít nhất 1 trệt + 1 lầu ·
            Toàn TP.HCM (kể cả Q2, Q9, Thủ Đức) · Đăng trong vòng 7 ngày.{' '}
            <strong>Gợi ý:</strong> các tin có badge 🎓 gần trường học.
          </span>
        </div>

        <ListingGrid
          listings={allListings}
          isLoading={isLoading && page === 0}
          hasMore={data?.hasMore || false}
          onLoadMore={handleLoadMore}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>
            Dữ liệu thu thập tự động từ{' '}
            <a href="https://www.nhatot.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Nhatot.com</a>,{' '}
            <a href="https://phongtro123.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">PhongTro123</a>,{' '}
            <a href="https://mogi.vn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Mogi.vn</a>,{' '}
            <a href="https://alonhadat.com.vn" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Alonhadat.vn</a>.
            Cập nhật tự động mỗi 15 phút · Tin trong 7 ngày gần nhất.
          </p>
        </div>
      </footer>
    </div>
  );
}
