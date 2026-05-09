'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { SOURCE_LABELS } from '@/lib/constants';

interface Stats {
  total: number;
  sources: Record<string, number>;
  lastScraped: string | null;
}

interface Props {
  stats: Stats | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function StatsBar({ stats, isRefreshing, onRefresh }: Props) {
  if (!stats) return null;

  const lastScrapedText = stats.lastScraped
    ? formatDistanceToNow(new Date(stats.lastScraped), {
        addSuffix: true,
        locale: vi,
      })
    : 'Chưa có dữ liệu';

  return (
    <div className="bg-blue-50 border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-700">
          {/* Tổng */}
          <span className="font-semibold">
            🏠 {stats.total.toLocaleString('vi-VN')} nhà phù hợp
          </span>

          {/* Chia theo nguồn */}
          <div className="flex gap-3">
            {Object.entries(stats.sources).map(([src, count]) => (
              <span key={src} className="text-blue-600">
                {SOURCE_LABELS[src] || src}: {count}
              </span>
            ))}
          </div>

          {/* Cập nhật lần cuối */}
          <span className="text-blue-500">Cập nhật {lastScrapedText}</span>

          {/* Nút làm mới */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-blue-700"
          >
            <svg
              className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            >
              <path d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0 1 15-4.5M20 15a9 9 0 0 1-15 4.5" strokeLinecap="round"/>
            </svg>
            {isRefreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
        </div>
      </div>
    </div>
  );
}
