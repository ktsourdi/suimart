/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Removed static export for better compatibility with dynamic features
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig