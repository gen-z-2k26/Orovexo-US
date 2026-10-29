import type { NextConfig } from "next";

function hostnameFromUrl(value?: string) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function uniqueHostnames() {
  const hosts = new Set<string>([
    "bonjourmellbourne.com",
    "www.bonjourmellbourne.com",
    "elbertjansens.nl",
    "tilascompany.com",
  ]);
  const fromEnv = hostnameFromUrl(process.env.WC_URL);
  if (fromEnv) hosts.add(fromEnv);
  return [...hosts];
}

const wcRemotePatterns = uniqueHostnames().flatMap((hostname) =>
  (["https", "http"] as const).map((protocol) => ({
    protocol,
    hostname,
    pathname: "/**" as const,
  })),
);

const nextConfig: NextConfig = {
  // Babel react-compiler workers were SIGBUS-crashing Turbopack on this machine.
  reactCompiler: false,
  async redirects() {
    return [
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/contact", destination: "/contact-us", permanent: true },
      { source: "/faq", destination: "/faqs", permanent: true },
      { source: "/commitment", destination: "/our-commitment", permanent: true },
      { source: "/track-order", destination: "/track-your-order", permanent: true },
    ];
  },
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
      {
        protocol: "https",
        hostname: "**.hostingersite.com",
        pathname: "/**",
      },
      ...wcRemotePatterns,
    ],
  },
};

export default nextConfig;
