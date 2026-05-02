'use client';

import { VALID_DISTRICTS } from '@/lib/constants';
import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  total: number;
  isLoading: boolean;
}

const PRICE_OPTIONS = [
  { label: 'Dưới 2 triệu', value: 2_000_000 },
  { label: 'Dưới 3 triệu', value: 3_000_000 },
  { label: 'Dưới 4 triệu', value: 4_000_000 },
  { label: 'Dưới 5 triệu', value: 5_000_000 },
  { label: 'Dưới 6 triệu', value: 6_000_000 },
  { label: 'Dưới 7 triệu', value: 7_000_000 },
];

const SOURCE_OPTIONS = [
  { label: 'Tất cả nguồn', value: 'all' },
  { label: 'Nhatot.com', value: 'nhatot' },
  { label: 'PhongTro123', value: 'phongtro123' },
  { label: 'Mogi.vn', value: 'batdongsan' },
  { label: 'Alonhadat.vn', value: 'alonhadat' },
];

export default function FilterBar({ filters, onChange, total, isLoading }: Props) {
  function update(partial: Partial<FilterState>) {
    onChange({ ...filters, ...partial });
  }

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Lọc quận/huyện */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Quận/Huyện</label>
            <select
              value={filters.district}
              onChange={e => update({ district: e.target.value })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              {VALID_DISTRICTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Lọc giá */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Giá tối đa</label>
            <select
              value={filters.maxPrice}
              onChange={e => update({ maxPrice: parseInt(e.target.value) })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {PRICE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Lọc nguồn */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500 whitespace-nowrap">Nguồn</label>
            <select
              value={filters.source}
              onChange={e => update({ source: e.target.value })}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Toggle nhà có lầu */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.multiFloor}
                onChange={e => update({ multiFloor: e.target.checked })}
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${filters.multiFloor ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform absolute top-0.5 ${filters.multiFloor ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600">Có lầu</span>
          </label>

          {/* Toggle mặt tiền */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={filters.frontage}
                onChange={e => update({ frontage: e.target.checked })}
              />
              <div className={`w-10 h-5 rounded-full transition-colors ${filters.frontage ? 'bg-blue-500' : 'bg-slate-200'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform absolute top-0.5 ${filters.frontage ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
            <span className="text-xs font-medium text-slate-600">Mặt tiền</span>
          </label>

          {/* Kết quả */}
          <div className="ml-auto flex items-center gap-2">
            {isLoading && (
              <span className="flex items-center gap-1 text-xs text-blue-500">
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full pulse-dot" />
                Đang tải...
              </span>
            )}
            <span className="text-sm font-semibold text-slate-700">
              {total.toLocaleString('vi-VN')} tin
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
