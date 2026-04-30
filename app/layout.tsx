import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Tìm Nhà Trọ HCM — Dưới 5 Triệu, Có Lầu',
  description:
    'Bot tự động cập nhật nhà trọ cho thuê tại TP.HCM dưới 5 triệu, có ít nhất 1 trệt 1 lầu. Dữ liệu từ Nhatot, Phongtro123, Mogi.',
  keywords: 'nhà trọ, thuê nhà, hcm, hồ chí minh, dưới 5 triệu, có lầu',
  openGraph: {
    title: 'Tìm Nhà Trọ HCM — Dưới 5 Triệu',
    description: 'Cập nhật tự động mỗi 15 phút. Lọc sẵn: giá < 5tr, có ít nhất 1 lầu, loại bỏ Q2, Q9, Thủ Đức.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
