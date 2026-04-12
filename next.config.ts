import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep your existing compiler setting */
  reactCompiler: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;