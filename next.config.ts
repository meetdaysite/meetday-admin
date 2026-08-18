import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://meetday-backend-371293689986.asia-south1.run.app/api/v1/:path*",
      },
    ]
  },
};

export default nextConfig;
