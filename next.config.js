/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permite QUALQUER hostname HTTPS
      },
      {
        protocol: 'http',
        hostname: '**', // Permite QUALQUER hostname HTTP
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig