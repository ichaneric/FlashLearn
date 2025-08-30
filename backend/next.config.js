/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost", "192.168.254.104"], // add your local IP or production domain
  },
  // Serve static files from public/uploads directory
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
