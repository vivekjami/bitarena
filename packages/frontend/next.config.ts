import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Enable WebAssembly support
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Three.js optimization
    config.resolve.alias = {
      ...config.resolve.alias,
      three: 'three',
    };

    return config;
  },

  // Transpile shared package
  transpilePackages: ['@bitarena/shared', 'three'],
};

export default nextConfig;
