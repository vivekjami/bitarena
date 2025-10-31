import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Empty turbopack config to silence warning (Turbopack is default in Next.js 16)
  turbopack: {},
  
  // Transpile shared package
  transpilePackages: ['@bitarena/shared', 'three'],
};

export default nextConfig;
