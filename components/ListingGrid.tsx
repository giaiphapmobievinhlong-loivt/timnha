'use client';

import ListingCard from './ListingCard';
import type { Listing } from '@/lib/types';

interface Props {
  listings: Listing[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-48 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-6 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="flex gap-2 mt-2">
          <div className="h-5 bg-slate-200 rounded-full w-16" />
          <div className="h-5 bg-slate-200 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

export default function ListingGrid({ listings, isLoading, hasMore, onLoadMore }: Props) {
  if (isLoading && listings.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 21V12h6v9" />
        </svg>
        <p className="text-lg font-medium">Không tìm thấy tin nào</p>
        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc đợi lần quét tiếp theo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {listings.map(listing => (
          <ListingCard key={`${listing.source}-${listing.external_id}`} listing={listing} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang tải...' : 'Xem thêm'}
          </button>
        </div>
      )}
    </div>
  );
}
