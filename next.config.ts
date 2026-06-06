import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-8df6d927fbb343468b08e5f0f8498440.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
