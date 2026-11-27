import type { NextConfig } from "next";
import path from "path";

const mediaHostname = process.env.NEXT_PUBLIC_MEDIA_HOSTNAME;

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      ...(mediaHostname
        ? [
            {
              protocol: "https" as const,
              hostname: mediaHostname,
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
