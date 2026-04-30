'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { SOURCE_LABELS, SOURCE_COLORS } from '@/lib/constants';

interface Props {
  listing: Listing;
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)} triệu/tháng`;
  }
  return `${price.toLocaleString('vi-VN')} đ/tháng`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Vừa đăng';
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  return `${diffDays} ngày trước`;
}

function isNew(dateStr: string): boolean {
  const date = new Date(dateStr);
  const diffHours = (Date.now() - date.getTime()) / 3_600_000;
  return diffHours < 24;
}

export default function ListingCard({ listing }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  const hasImages = listing.images?.length > 0 && !imgError;
  const imgSrc = hasImages ? listing.images[imgIdx] : null;

  return (
    <div className="card flex flex-col h-full animate-fade-in">
      {/* Ảnh */}
      <div className="relative w-full h-48 bg-slate-100 flex-shrink-0">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={listing.title}
            fill
            className="object-cover"
            onError={() => {
              if (imgIdx < (listing.images?.length || 0) - 1) {
                setImgIdx(i => i + 1);
              } else {
                setImgError(true);
              }
            }}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.75L12 3l9 6.75V21H3V9.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 21V12h6v9" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {isNew(listing.posted_at) && (
            <span className="badge bg-red-500 text-white text-[10px] font-bold">MỚI</span>
          )}
          <span className={`badge text-[10px] ${SOURCE_COLORS[listing.source] || 'bg-gray-100 text-gray-600'}`}>
            {SOURCE_LABELS[listing.source] || listing.source}
          </span>
        </div>

        {/* Số ảnh */}
        {listing.images?.length > 1 && (
          <span className="absolute bottom-2 right-2 badge bg-black/50 text-white text-[10px]">
            {listing.images.length} ảnh
          </span>
        )}
      </div>

      {/* Nội dung */}
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Giá */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-green-600">
            {formatPrice(listing.price)}
          </span>
          {listing.area && (
            <span className="text-sm text-slate-500 font-medium">
              {listing.area} m²
            </span>
          )}
        </div>

        {/* Tiêu đề */}
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">
          {listing.title}
        </h3>

        {/* Địa chỉ */}
        {listing.district && (
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{listing.address || listing.district}</span>
          </div>
        )}

        {/* Tags: tầng lầu + trường học */}
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          <span className="badge bg-blue-50 text-blue-700 text-[11px]">
            🏠 Có lầu
          </span>
          {listing.nearby_schools?.slice(0, 2).map(school => (
            <span key={school} className="badge bg-yellow-50 text-yellow-700 text-[11px] max-w-[130px] truncate">
              🎓 {school}
            </span>
          ))}
          {(listing.nearby_schools?.length || 0) > 2 && (
            <span className="badge bg-yellow-50 text-yellow-600 text-[11px]">
              +{listing.nearby_schools!.length - 2} trường
            </span>
          )}
        </div>

        {/* Footer: ngày đăng + nút xem */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400">{formatDate(listing.posted_at)}</span>
          <a
            href={listing.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-1.5 px-3 text-xs"
          >
            Xem tin →
          </a>
        </div>
      </div>
    </div>
  );
}
