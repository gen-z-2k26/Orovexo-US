import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/photos/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/videos/**",
      },
      {
        protocol: "https",
        hostname: "videos.pexels.com",
        pathname: "/video-files/**",
      },
    ],
  },
};

export default nextConfig;
