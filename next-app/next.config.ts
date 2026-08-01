import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/:path*",
        destination: "/:path*.html",
      },
    ];
  },
};

export default nextConfig;
