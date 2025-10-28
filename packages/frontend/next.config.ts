/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Three.js WebAssembly support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Optimize Three.js
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        three$: 'three/build/three.module.js',
      };
    }

    return config;
  },
  transpilePackages: ['@bitarena/shared'],
};

module.exports = nextConfig;