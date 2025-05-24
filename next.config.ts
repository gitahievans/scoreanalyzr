import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // turbo: false, // ⛔ disables Turbopack and uses Webpack instead
  },
};

export default nextConfig;
