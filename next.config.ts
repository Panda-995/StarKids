import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ["nodemailer"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
