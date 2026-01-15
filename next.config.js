/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    emotion: true
  },
  transpilePackages: ['@mui/material'],
  output: 'standalone',
  /*
  async rewrites() {
    // Disabled to prevent infinite redirect loops until WORDPRESS_URL is confirmed.
    // const WP_URL = process.env.WORDPRESS_URL || 'https://experiahub.com';
    return [];
  }
  */
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