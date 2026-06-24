import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@apice/types', '@apice/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
}

export default nextConfig
