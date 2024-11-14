/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
          { key: 'Cache-Control', value: 's-maxage=1, stale-while-revalidate' },
        ],
      },
    ];
  },
  experimental: {
    largePageDataBytes: 128 * 100000,
  },
  images: {
    domains: ['gogocdn.net'],
  },
  poweredByHeader: false,
}

module.exports = nextConfig