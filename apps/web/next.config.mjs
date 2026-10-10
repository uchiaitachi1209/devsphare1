/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@devsphere/shared', '@devsphere/scanner-core'],
  async rewrites() {
    const targetApi =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:4000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${targetApi}/api/v1/:path*`,
      },
      {
        source: '/docs/:path*',
        destination: `${targetApi}/docs/:path*`,
      },
      {
        source: '/docs',
        destination: `${targetApi}/docs`,
      },
    ];
  },
};

export default nextConfig;
