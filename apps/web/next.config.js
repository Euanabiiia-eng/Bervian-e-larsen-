/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['example.com'],
  },
  transpilePackages: ['@apice/types', '@apice/utils'],
}

module.exports = nextConfig
