import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify: true,

  // Optional: Allow domains if loading remote audio files
  images: {
    domains: ['translate.google.com'], // if you're using Google TTS audio URL
  },

  // Enable experimental features for App Router
  // experimental: {
  //   appDir: true,
  // },

  // Required for custom path aliases like @/components
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': require('path').resolve(__dirname, 'src'),
    };
    return config;
  },
};

export default nextConfig;
