import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'static.chotot.com' },
      { hostname: 'img.chotot.com' },
      { hostname: 'images.chotot.com' },
      { hostname: 'img.phongtro123.com' },
      { hostname: 'cdn.phongtro123.com' },
      { hostname: 'cdn.mogi.vn' },
      { hostname: 'batdongsan.com.vn' },
      { hostname: '*.batdongsan.com.vn' },
    ],
    unoptimized: false,
  },
  // cheerio chạy phía server, không bundle vào client
  serverExternalPackages: ['cheerio'],
};

export default nextConfig;
