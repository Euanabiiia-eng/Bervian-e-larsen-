/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@apice/types', '@apice/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
}

export default nextConfig
