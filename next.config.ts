/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors (use with caution)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config: any, { isServer }: any) => {
    if (!isServer) {
      // Don't resolve these modules on the client to prevent build errors
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        child_process: false,
        tls: false,
        stream: false,
        util: false,
        buffer: false,
        crypto: false,
        path: false,
        os: false,
        'node:stream': false,
        'node:util': false,
        'node:buffer': false,
        'node:crypto': false,
        'node:path': false,
        'node:os': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig