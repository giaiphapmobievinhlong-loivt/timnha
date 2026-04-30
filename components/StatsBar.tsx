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
  nextRefresh: number; // giây còn lại
}

export default function StatsBar({ stats, nextRefresh }: Props) {
  if (!stats) return null;

  const lastScrapedText = stats.lastScraped
    ? formatDistanceToNow(new Date(stats.lastScraped), {
        addSuffix: true,
        locale: vi,
      })
    : 'Chưa có dữ liệu';

  const minutes = Math.floor(nextRefresh / 60);
  const seconds = nextRefresh % 60;

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

          {/* Đếm ngược refresh */}
          <span className="ml-auto font-mono text-blue-500 tabular-nums">
            ⏱ {minutes}:{String(seconds).padStart(2, '0')} đến lần quét tiếp
          </span>
        </div>
      </div>
    </div>
  );
}
