import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Keep your existing compiler setting */
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zhafnwjqkhhoorzpxvhs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;