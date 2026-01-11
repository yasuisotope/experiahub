/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    emotion: true
  },
  transpilePackages: ['@mui/material'],
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: false,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '**'
      }
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      {
        source: '/onboarding',
        destination: '/supplier',
        permanent: false,
      }
    ]
  }
};

module.exports = nextConfig;