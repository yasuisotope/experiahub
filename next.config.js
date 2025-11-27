/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    emotion: true
  },
  transpilePackages: ['@mui/material'],
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
    ],
  },
};

module.exports = nextConfig;