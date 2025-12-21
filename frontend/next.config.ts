import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.BACKEND_URL
          ? `http://${process.env.BACKEND_URL}/:path*`
          : "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
